import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { ReturnedBlood } from './entities/returned-blood.entity';
import {
  CreateReturnedBloodDto,
  InspectReturnedDto,
  QueryReturnedDto,
} from './dto/returned.dto';
import { ReturnedStatus, BloodBagStatus } from '../../common/enums';
import { BloodBag } from '../blood-bag/entities/blood-bag.entity';

@Injectable()
export class ReturnedService {
  private readonly logger = new Logger(ReturnedService.name);

  constructor(
    @InjectRepository(ReturnedBlood)
    private readonly returnedRepository: Repository<ReturnedBlood>,
    @InjectRepository(BloodBag)
    private readonly bloodBagRepository: Repository<BloodBag>,
  ) {}

  private generateReturnNo(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TH${yyyy}${mm}${dd}${rand}`;
  }

  async create(dto: CreateReturnedBloodDto): Promise<ReturnedBlood> {
    const bag = await this.bloodBagRepository.findOne({
      where: { id: dto.bloodBagId },
    });
    if (!bag) {
      throw new NotFoundException(`血袋 ${dto.bloodBagId} 不存在`);
    }

    const existing = await this.returnedRepository.findOne({
      where: {
        bloodBagId: dto.bloodBagId,
        status: ReturnedStatus.PENDING,
      },
    });
    if (existing) {
      throw new BadRequestException('该血袋已有待处理的退回记录');
    }

    const returned = this.returnedRepository.create({
      ...dto,
      returnNo: this.generateReturnNo(),
      returnTime: new Date(dto.returnTime),
      status: ReturnedStatus.PENDING,
    });

    const saved = await this.returnedRepository.save(returned);

    bag.status = BloodBagStatus.RETURNED;
    await this.bloodBagRepository.save(bag);

    return saved;
  }

  async findAll(query: QueryReturnedDto) {
    const {
      status,
      reason,
      hospitalCode,
      appointmentId,
      bagCode,
      returnNo,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.returnedRepository.createQueryBuilder('r');

    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    if (reason) {
      qb.andWhere('r.reason = :reason', { reason });
    }
    if (hospitalCode) {
      qb.andWhere('r.hospitalCode = :hospitalCode', { hospitalCode });
    }
    if (appointmentId) {
      qb.andWhere('r.appointmentId = :appointmentId', { appointmentId });
    }
    if (bagCode) {
      qb.andWhere('r.bagCode LIKE :bagCode', { bagCode: `%${bagCode}%` });
    }
    if (returnNo) {
      qb.andWhere('r.returnNo LIKE :returnNo', { returnNo: `%${returnNo}%` });
    }

    qb.orderBy('r.createdAt', 'DESC');

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

  async findOne(id: string): Promise<ReturnedBlood> {
    const returned = await this.returnedRepository.findOne({ where: { id } });
    if (!returned) {
      throw new NotFoundException(`退回记录 ${id} 不存在`);
    }
    return returned;
  }

  async findByNo(returnNo: string): Promise<ReturnedBlood> {
    const returned = await this.returnedRepository.findOne({ where: { returnNo } });
    if (!returned) {
      throw new NotFoundException(`退回单 ${returnNo} 不存在`);
    }
    return returned;
  }

  async inspect(id: string, dto: InspectReturnedDto): Promise<ReturnedBlood> {
    const returned = await this.findOne(id);
    if (returned.status !== ReturnedStatus.PENDING) {
      throw new BadRequestException('仅待处理状态可进行复检');
    }

    returned.status = ReturnedStatus.INSPECTING;
    returned.inspectionResult = dto.inspectionResult;
    returned.inspectionTime = new Date();
    returned.inspectionOperator = dto.operator;

    const inspected = await this.returnedRepository.save(returned);

    const bag = await this.bloodBagRepository.findOne({
      where: { id: returned.bloodBagId },
    });

    if (bag) {
      if (dto.finalStatus === ReturnedStatus.RE_INVENTORY) {
        if (bag.temperatureAlert) {
          throw new BadRequestException('该血袋存在温度异常，不可重新入库');
        }
        const now = new Date();
        if (bag.expireDate <= now) {
          throw new BadRequestException('该血袋已过期，不可重新入库');
        }
        bag.status = BloodBagStatus.IN_STOCK;
        bag.currentAppointmentId = null;
        bag.currentHandoverId = null;
        inspected.status = ReturnedStatus.RE_INVENTORY;
      } else if (dto.finalStatus === ReturnedStatus.DISCARDED) {
        bag.status = BloodBagStatus.DISCARDED;
        inspected.status = ReturnedStatus.DISCARDED;
      }
      await this.bloodBagRepository.save(bag);
    }

    return await this.returnedRepository.save(inspected);
  }

  async discard(id: string, operator: string, reason: string): Promise<ReturnedBlood> {
    const returned = await this.findOne(id);
    if (
      returned.status !== ReturnedStatus.PENDING &&
      returned.status !== ReturnedStatus.INSPECTING
    ) {
      throw new BadRequestException('当前状态不可报废');
    }

    returned.status = ReturnedStatus.DISCARDED;
    returned.inspectionResult = reason || '报废处理';
    returned.inspectionTime = new Date();
    returned.inspectionOperator = operator;

    const bag = await this.bloodBagRepository.findOne({
      where: { id: returned.bloodBagId },
    });
    if (bag) {
      bag.status = BloodBagStatus.DISCARDED;
      await this.bloodBagRepository.save(bag);
    }

    return await this.returnedRepository.save(returned);
  }

  async reInventory(id: string, operator: string): Promise<ReturnedBlood> {
    const returned = await this.findOne(id);
    if (
      returned.status !== ReturnedStatus.PENDING &&
      returned.status !== ReturnedStatus.INSPECTING
    ) {
      throw new BadRequestException('当前状态不可重新入库');
    }

    const bag = await this.bloodBagRepository.findOne({
      where: { id: returned.bloodBagId },
    });

    if (!bag) {
      throw new NotFoundException('关联血袋不存在');
    }
    if (bag.temperatureAlert) {
      throw new BadRequestException('该血袋存在温度异常，不可重新入库');
    }
    const now = new Date();
    if (bag.expireDate <= now) {
      throw new BadRequestException('该血袋已过期，不可重新入库');
    }

    bag.status = BloodBagStatus.IN_STOCK;
    bag.currentAppointmentId = null;
    bag.currentHandoverId = null;
    await this.bloodBagRepository.save(bag);

    returned.status = ReturnedStatus.RE_INVENTORY;
    returned.inspectionResult = '复检合格，重新入库';
    returned.inspectionTime = new Date();
    returned.inspectionOperator = operator;

    return await this.returnedRepository.save(returned);
  }
}
