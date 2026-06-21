import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Appointment } from './entities/appointment.entity';
import { AppointmentItem } from './entities/appointment-item.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentDto,
  ApproveAppointmentDto,
  RejectAppointmentDto,
  CancelAppointmentDto,
} from './dto/appointment.dto';
import { AppointmentStatus, BloodBagStatus, UrgencyLevel } from '../../common/enums';
import { BloodBagService } from '../blood-bag/blood-bag.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private readonly appointmentItemRepository: Repository<AppointmentItem>,
    private readonly bloodBagService: BloodBagService,
    private readonly configService: ConfigService,
  ) {}

  private generateAppointmentNo(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `YY${yyyy}${mm}${dd}${rand}`;
  }

  async create(createDto: CreateAppointmentDto): Promise<Appointment> {
    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('预约明细不能为空');
    }

    const expectedUseDate = new Date(createDto.expectedUseDate);
    if (expectedUseDate < new Date()) {
      throw new BadRequestException('预计使用日期不能早于当前时间');
    }

    const appointment = this.appointmentRepository.create({
      ...createDto,
      appointmentNo: this.generateAppointmentNo(),
      expectedUseDate,
      status: AppointmentStatus.PENDING,
      crossMatchRequired:
        createDto.crossMatchRequired ??
        this.configService.get<boolean>('CROSS_MATCH_REQUIRED') ?? true,
      items: createDto.items.map((item) =>
        this.appointmentItemRepository.create(item),
      ),
    });

    return await this.appointmentRepository.save(appointment);
  }

  async findAll(query: QueryAppointmentDto) {
    const {
      status,
      hospitalCode,
      appointmentNo,
      urgencyLevel,
      keyword,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.appointmentRepository.createQueryBuilder('appt');
    qb.leftJoinAndSelect('appt.items', 'items');

    if (status) {
      qb.andWhere('appt.status = :status', { status });
    }
    if (hospitalCode) {
      qb.andWhere('appt.hospitalCode = :hospitalCode', { hospitalCode });
    }
    if (appointmentNo) {
      qb.andWhere('appt.appointmentNo LIKE :appointmentNo', {
        appointmentNo: `%${appointmentNo}%` });
    }
    if (urgencyLevel) {
      qb.andWhere('appt.urgencyLevel = :urgencyLevel', { urgencyLevel });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('appt.appointmentNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('appt.hospitalName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('appt.patientName LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    qb.orderBy('appt.createdAt', 'DESC');

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

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!appointment) {
      throw new NotFoundException(`预约单 ${id} 不存在`);
    }
    return appointment;
  }

  async findByNo(appointmentNo: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointmentNo },
      relations: ['items'],
    });
    if (!appointment) {
      throw new NotFoundException(`预约单 ${appointmentNo} 不存在`);
    }
    return appointment;
  }

  async approve(id: string, dto: ApproveAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('仅待审核状态才可审批');
    }

    appointment.status = AppointmentStatus.APPROVED;
    appointment.approvedBy = dto.operator;
    appointment.approvedTime = new Date();

    return await this.appointmentRepository.save(appointment);
  }

  async reject(id: string, dto: RejectAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('仅待审核状态才可驳回');
    }

    appointment.status = AppointmentStatus.REJECTED;
    appointment.rejectReason = dto.reason;

    return await this.appointmentRepository.save(appointment);
  }

  async allocateBags(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (
      appointment.status !== AppointmentStatus.APPROVED &&
      appointment.status !== AppointmentStatus.ALLOCATING
    ) {
      throw new BadRequestException('当前状态不可进行血袋分配');
    }

    appointment.status = AppointmentStatus.ALLOCATING;
    await this.appointmentRepository.save(appointment);

    try {
      for (const item of appointment.items) {
        const remainingQty = item.quantity - item.allocatedQuantity;
        if (remainingQty > 0) {
          const allocated = await this.bloodBagService.allocateBloodBags({
            appointmentId: id,
            bloodType: item.bloodType,
            componentType: item.componentType,
            quantity: remainingQty,
          });
          item.allocatedQuantity += allocated.length;
          await this.appointmentItemRepository.save(item);
        }
      }

      const allAllocated = appointment.items.every(
        (item) => item.allocatedQuantity >= item.quantity,
      );
      appointment.status = allAllocated
        ? AppointmentStatus.ALLOCATED
        : AppointmentStatus.APPROVED;

      if (appointment.crossMatchRequired && allAllocated) {
        appointment.status = AppointmentStatus.CROSS_MATCHING;
      }

      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      appointment.status = AppointmentStatus.APPROVED;
      await this.appointmentRepository.save(appointment);
      throw error;
    }
  }

  async confirmCrossMatch(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (
      appointment.status !== AppointmentStatus.CROSS_MATCHING) {
      throw new BadRequestException('当前状态不可确认交叉配血');
    }

    appointment.status = AppointmentStatus.CROSS_MATCH_CONFIRMED;
    return await this.appointmentRepository.save(appointment);
  }

  async failCrossMatch(id: string, reason: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.status !== AppointmentStatus.CROSS_MATCHING) {
      throw new BadRequestException('当前状态不可标记配血失败');
    }

    appointment.status = AppointmentStatus.CROSS_MATCH_FAILED;
    appointment.rejectReason = reason;

    await this.bloodBagService.releasePreemptedBags(id);

    return await this.appointmentRepository.save(appointment);
  }

  async markReadyForDelivery(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.crossMatchRequired) {
      if (appointment.status !== AppointmentStatus.CROSS_MATCH_CONFIRMED) {
        throw new BadRequestException('交叉配血未确认，不可出库');
      }
    } else {
      if (
        appointment.status !== AppointmentStatus.ALLOCATED &&
        appointment.status !== AppointmentStatus.CROSS_MATCH_CONFIRMED
      ) {
        throw new BadRequestException('当前状态不可标记待发货');
      }
    }

    appointment.status = AppointmentStatus.READY_FOR_DELIVERY;
    return await this.appointmentRepository.save(appointment);
  }

  async cancel(id: string, dto: CancelAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    const notCancellableStatuses = [
      AppointmentStatus.PENDING,
      AppointmentStatus.APPROVED,
      AppointmentStatus.ALLOCATED,
      AppointmentStatus.CROSS_MATCHING,
      AppointmentStatus.CROSS_MATCH_CONFIRMED,
      AppointmentStatus.READY_FOR_DELIVERY,
    ];

    if (!notCancellableStatuses.includes(appointment.status)) {
      throw new BadRequestException('当前状态不可取消');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    if (dto.reason) {
      appointment.rejectReason = dto.reason;
    }

    await this.bloodBagService.releasePreemptedBags(id);

    return await this.appointmentRepository.save(appointment);
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (
      appointment.status !== AppointmentStatus.IN_TRANSIT) {
      throw new BadRequestException('仅运输中状态才可完成');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    return await this.appointmentRepository.save(appointment);
  }

  async update(id: string, updateDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateDto);
    return await this.appointmentRepository.save(appointment);
  }
}
