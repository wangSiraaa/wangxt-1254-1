import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Handover } from './entities/handover.entity';
import { HandoverItem } from './entities/handover-item.entity';
import {
  CreateHandoverDto,
  ScanBagDto,
  DispatchHandoverDto,
  ReceiveHandoverDto,
  RejectHandoverDto,
  BatchReceiveDto,
  QueryHandoverDto,
} from './dto/handover.dto';
import { HandoverStatus, HandoverType, BloodBagStatus, AppointmentStatus } from '../../common/enums';
import { BloodBag } from '../blood-bag/entities/blood-bag.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { TemperatureService } from '../temperature/temperature.service';

@Injectable()
export class HandoverService {
  private readonly logger = new Logger(HandoverService.name);

  constructor(
    @InjectRepository(Handover)
    private readonly handoverRepository: Repository<Handover>,
    @InjectRepository(HandoverItem)
    private readonly handoverItemRepository: Repository<HandoverItem>,
    @InjectRepository(BloodBag)
    private readonly bloodBagRepository: Repository<BloodBag>,
    private readonly appointmentService: AppointmentService,
    private readonly temperatureService: TemperatureService,
    private readonly configService: ConfigService,
  ) {}

  private generateHandoverNo(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `JJ${yyyy}${mm}${dd}${rand}`;
  }

  private checkTemperatureRange(temperature: number): { normal: boolean; alert: boolean } {
    const minTemp = this.configService.get<number>('COLD_CHAIN_MIN_TEMP') ?? 2;
    const maxTemp = this.configService.get<number>('COLD_CHAIN_MAX_TEMP') ?? 6;
    const normal = temperature >= minTemp && temperature <= maxTemp;
    return { normal, alert: !normal };
  }

  async create(createDto: CreateHandoverDto): Promise<Handover> {
    if (createDto.appointmentId) {
      const appointment = await this.appointmentService.findOne(createDto.appointmentId);
      if (appointment.status !== AppointmentStatus.READY_FOR_DELIVERY) {
        throw new BadRequestException('预约单未处于待发货状态，不可创建交接单');
      }
    }

    const handover = this.handoverRepository.create({
      ...createDto,
      handoverNo: this.generateHandoverNo(),
      status: HandoverStatus.PENDING,
      items: [],
    });

    if (createDto.scannedBags && createDto.scannedBags.length > 0) {
      for (const scanned of createDto.scannedBags) {
        const bag = await this.bloodBagRepository.findOne({
          where: { bagCode: scanned.bagCode },
        });
        if (!bag) {
          throw new NotFoundException(`血袋 ${scanned.bagCode} 不存在`);
        }
        if (
          bag.status !== BloodBagStatus.PREEMPTED &&
          bag.status !== BloodBagStatus.ALLOCATED
        ) {
          throw new BadRequestException(`血袋 ${scanned.bagCode} 状态不可出库`);
        }
        if (bag.temperatureAlert) {
          throw new BadRequestException(`血袋 ${scanned.bagCode} 存在温度异常，不可出库`);
        }

        let tempAlert = false;
        if (scanned.temperatureReceived !== undefined) {
          tempAlert = this.checkTemperatureRange(scanned.temperatureReceived).alert;
        }

        handover.items.push(
          this.handoverItemRepository.create({
            bloodBagId: bag.id,
            bagCode: bag.bagCode,
            scanTime: new Date(),
            temperatureReceived: scanned.temperatureReceived ?? null,
            temperatureAlert: tempAlert,
          }),
        );
      }
    }

    const saved = await this.handoverRepository.save(handover);

    for (const item of saved.items) {
      const bag = await this.bloodBagRepository.findOne({ where: { id: item.bloodBagId } });
      if (bag) {
        bag.status = BloodBagStatus.IN_TRANSIT;
        bag.currentHandoverId = saved.id;
        await this.bloodBagRepository.save(bag);
      }
    }

    if (createDto.appointmentId) {
      await this.appointmentService.update(createDto.appointmentId, {
        status: AppointmentStatus.IN_TRANSIT,
      });
    }

    return saved;
  }

  async scanBag(handoverId: string, dto: ScanBagDto): Promise<HandoverItem> {
    const handover = await this.findOne(handoverId);
    if (handover.status !== HandoverStatus.PENDING) {
      throw new BadRequestException('仅待发货状态可扫码添加血袋');
    }

    const existingItem = handover.items.find((i) => i.bagCode === dto.bagCode);
    if (existingItem) {
      throw new BadRequestException(`血袋 ${dto.bagCode} 已在交接单中`);
    }

    const bag = await this.bloodBagRepository.findOne({
      where: { bagCode: dto.bagCode },
    });
    if (!bag) {
      throw new NotFoundException(`血袋 ${dto.bagCode} 不存在`);
    }
    if (
      bag.status !== BloodBagStatus.PREEMPTED &&
      bag.status !== BloodBagStatus.ALLOCATED
    ) {
      throw new BadRequestException(`血袋 ${dto.bagCode} 当前状态不可出库`);
    }
    if (bag.temperatureAlert) {
      throw new BadRequestException(`血袋 ${dto.bagCode} 存在温度异常，不可出库`);
    }

    const tempCheck = this.checkTemperatureRange(dto.temperature ?? 4);
    const item = this.handoverItemRepository.create({
      handoverId,
      bloodBagId: bag.id,
      bagCode: bag.bagCode,
      scanTime: new Date(),
      scanOperator: dto.operator,
      temperatureReceived: dto.temperature ?? null,
      temperatureAlert: tempCheck.alert,
    });

    const savedItem = await this.handoverItemRepository.save(item);

    bag.status = BloodBagStatus.IN_TRANSIT;
    bag.currentHandoverId = handoverId;
    await this.bloodBagRepository.save(bag);

    return savedItem;
  }

  async findAll(query: QueryHandoverDto) {
    const {
      status,
      handoverType,
      appointmentId,
      hospitalCode,
      handoverNo,
      keyword,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.handoverRepository.createQueryBuilder('h');
    qb.leftJoinAndSelect('h.items', 'items');

    if (status) {
      qb.andWhere('h.status = :status', { status });
    }
    if (handoverType) {
      qb.andWhere('h.handoverType = :handoverType', { handoverType });
    }
    if (appointmentId) {
      qb.andWhere('h.appointmentId = :appointmentId', { appointmentId });
    }
    if (hospitalCode) {
      qb.andWhere('h.hospitalCode = :hospitalCode', { hospitalCode });
    }
    if (handoverNo) {
      qb.andWhere('h.handoverNo LIKE :handoverNo', { handoverNo: `%${handoverNo}%` });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('h.handoverNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('h.hospitalName LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    qb.orderBy('h.createdAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<Handover> {
    const handover = await this.handoverRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!handover) {
      throw new NotFoundException(`交接单 ${id} 不存在`);
    }
    return handover;
  }

  async findByNo(handoverNo: string): Promise<Handover> {
    const handover = await this.handoverRepository.findOne({
      where: { handoverNo },
      relations: ['items'],
    });
    if (!handover) {
      throw new NotFoundException(`交接单 ${handoverNo} 不存在`);
    }
    return handover;
  }

  async dispatch(id: string, dto: DispatchHandoverDto): Promise<Handover> {
    const handover = await this.findOne(id);
    if (handover.status !== HandoverStatus.PENDING) {
      throw new BadRequestException('仅待发货状态可执行发运');
    }
    if (handover.items.length === 0) {
      throw new BadRequestException('交接单无血袋，不可发运');
    }

    handover.status = HandoverStatus.IN_TRANSIT;
    handover.dispatcherName = dto.dispatcherName;
    handover.dispatcherTime = new Date();
    if (dto.courierName) handover.courierName = dto.courierName;
    if (dto.vehicleNo) handover.vehicleNo = dto.vehicleNo;

    return await this.handoverRepository.save(handover);
  }

  async receive(id: string, dto: ReceiveHandoverDto): Promise<Handover> {
    const handover = await this.findOne(id);
    if (handover.status !== HandoverStatus.IN_TRANSIT) {
      throw new BadRequestException('仅运输中状态可执行接收');
    }

    const allAlert = handover.items.every((i) => i.temperatureAlert);
    if (allAlert && handover.items.length > 0) {
      throw new BadRequestException('所有血袋均存在温度超限，不可接收');
    }

    handover.status = HandoverStatus.RECEIVED;
    handover.receiverName = dto.receiverName;
    handover.receiveTime = new Date();
    handover.receiveHospitalCode = dto.hospitalCode;

    const saved = await this.handoverRepository.save(handover);

    const acceptedBagIds = handover.items
      .filter((i) => i.accepted && !i.temperatureAlert)
      .map((i) => i.bloodBagId);

    if (acceptedBagIds.length > 0) {
      await this.bloodBagRepository
        .createQueryBuilder()
        .update(BloodBag)
        .set({ status: BloodBagStatus.RECEIVED })
        .whereInIds(acceptedBagIds)
        .execute();
    }

    if (handover.appointmentId) {
      await this.appointmentService.complete(handover.appointmentId);
    }

    return saved;
  }

  async reject(id: string, dto: RejectHandoverDto): Promise<Handover> {
    const handover = await this.findOne(id);
    if (handover.status !== HandoverStatus.IN_TRANSIT) {
      throw new BadRequestException('仅运输中状态可执行拒收');
    }

    handover.status = HandoverStatus.REJECTED;
    handover.receiverName = dto.receiverName;
    handover.rejectReason = dto.reason;
    handover.receiveTime = new Date();

    const saved = await this.handoverRepository.save(handover);

    const bagIds = handover.items.map((i) => i.bloodBagId);
    if (bagIds.length > 0) {
      await this.bloodBagRepository
        .createQueryBuilder()
        .update(BloodBag)
        .set({ status: BloodBagStatus.RETURNED })
        .whereInIds(bagIds)
        .execute();
    }

    return saved;
  }

  async batchReceive(handoverId: string, dto: BatchReceiveDto): Promise<Handover> {
    const handover = await this.findOne(handoverId);
    if (handover.status !== HandoverStatus.IN_TRANSIT) {
      throw new BadRequestException('仅运输中状态可执行接收');
    }

    let anyAccepted = false;
    for (const receiveItem of dto.items) {
      const item = handover.items.find((i) => i.id === receiveItem.handoverItemId);
      if (!item) continue;

      if (receiveItem.temperatureReceived !== undefined) {
        const tempCheck = this.checkTemperatureRange(receiveItem.temperatureReceived);
        item.temperatureReceived = receiveItem.temperatureReceived;
        item.temperatureAlert = tempCheck.alert;

        await this.temperatureService.recordTemperature({
          handoverId,
          bloodBagId: item.bloodBagId,
          coldChainDeviceCode: handover.coldChainDeviceCode,
          temperature: receiveItem.temperatureReceived,
        });

        if (tempCheck.alert) {
          receiveItem.accepted = false;
          receiveItem.rejectReason = receiveItem.rejectReason || '冷链温度超限';
          await this.bloodBagRepository.update(item.bloodBagId, {
            temperatureAlert: true,
          });
        }
      }

      if (receiveItem.accepted && !item.temperatureAlert) {
        item.accepted = true;
        anyAccepted = true;
        await this.bloodBagRepository.update(item.bloodBagId, {
          status: BloodBagStatus.RECEIVED,
        });
      } else {
        item.accepted = false;
        item.rejectReason = receiveItem.rejectReason;
        await this.bloodBagRepository.update(item.bloodBagId, {
          status: BloodBagStatus.RETURNED,
        });
      }
      await this.handoverItemRepository.save(item);
    }

    handover.receiverName = dto.receiverName;
    handover.receiveHospitalCode = dto.hospitalCode;
    handover.receiveTime = new Date();
    handover.status = anyAccepted ? HandoverStatus.RECEIVED : HandoverStatus.REJECTED;

    const saved = await this.handoverRepository.save(handover);

    if (handover.appointmentId && anyAccepted) {
      await this.appointmentService.complete(handover.appointmentId);
    }

    return saved;
  }
}
