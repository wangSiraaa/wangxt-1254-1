import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThanOrEqual, MoreThan, Brackets } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BloodBag } from './entities/blood-bag.entity';
import { CreateBloodBagDto, UpdateBloodBagDto, QueryBloodBagDto, ConfirmCrossMatchDto, AllocateBloodBagDto } from './dto/blood-bag.dto';
import { BloodBagStatus, AppointmentStatus } from '../../common/enums';
import { RedisLockService } from '../../common/services/redis-lock.service';

@Injectable()
export class BloodBagService {
  private readonly logger = new Logger(BloodBagService.name);

  constructor(
    @InjectRepository(BloodBag)
    private readonly bloodBagRepository: Repository<BloodBag>,
    private readonly configService: ConfigService,
    private readonly redisLockService: RedisLockService,
  ) {}

  async create(createDto: CreateBloodBagDto): Promise<BloodBag> {
    const existing = await this.bloodBagRepository.findOne({
      where: { bagCode: createDto.bagCode },
    });
    if (existing) {
      throw new ConflictException(`血袋编号 ${createDto.bagCode} 已存在`);
    }

    const collectDate = new Date(createDto.collectDate);
    const expireDate = new Date(createDto.expireDate);
    if (expireDate <= collectDate) {
      throw new BadRequestException('失效日期必须晚于采集日期');
    }

    const bloodBag = this.bloodBagRepository.create({
      ...createDto,
      collectDate,
      expireDate,
    });

    return await this.bloodBagRepository.save(bloodBag);
  }

  async findAll(query: QueryBloodBagDto) {
    const {
      bloodType,
      componentType,
      status,
      bagCode,
      batchNo,
      keyword,
      expiringSoon,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.bloodBagRepository.createQueryBuilder('bag');

    if (bloodType) {
      qb.andWhere('bag.bloodType = :bloodType', { bloodType });
    }
    if (componentType) {
      qb.andWhere('bag.componentType = :componentType', { componentType });
    }
    if (status) {
      qb.andWhere('bag.status = :status', { status });
    }
    if (bagCode) {
      qb.andWhere('bag.bagCode LIKE :bagCode', { bagCode: `%${bagCode}%` });
    }
    if (batchNo) {
      qb.andWhere('bag.batchNo LIKE :batchNo', { batchNo: `%${batchNo}%` });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('bag.bagCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('bag.batchNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('bag.donorCode LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    if (expiringSoon) {
      const warnDays = this.configService.get<number>('BAG_EXPIRE_WARN_DAYS') ?? 7;
      const warnDate = new Date();
      warnDate.setDate(warnDate.getDate() + warnDays);
      qb.andWhere('bag.expireDate <= :warnDate', { warnDate });
      qb.andWhere('bag.expireDate > :now', { now: new Date() });
      qb.andWhere('bag.status IN (:...statuses)', {
        statuses: [BloodBagStatus.IN_STOCK, BloodBagStatus.PREEMPTED],
      });
    }

    qb.orderBy('bag.expireDate', 'ASC');

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

  async findOne(id: string): Promise<BloodBag> {
    const bloodBag = await this.bloodBagRepository.findOne({ where: { id } });
    if (!bloodBag) {
      throw new NotFoundException(`血袋 ${id} 不存在`);
    }
    return bloodBag;
  }

  async findByBagCode(bagCode: string): Promise<BloodBag> {
    const bloodBag = await this.bloodBagRepository.findOne({ where: { bagCode } });
    if (!bloodBag) {
      throw new NotFoundException(`血袋编号 ${bagCode} 不存在`);
    }
    return bloodBag;
  }

  async update(id: string, updateDto: UpdateBloodBagDto): Promise<BloodBag> {
    const bloodBag = await this.findOne(id);
    Object.assign(bloodBag, updateDto);
    return await this.bloodBagRepository.save(bloodBag);
  }

  async remove(id: string): Promise<void> {
    const bloodBag = await this.findOne(id);
    if (bloodBag.status !== BloodBagStatus.IN_STOCK && bloodBag.status !== BloodBagStatus.EXPIRED && bloodBag.status !== BloodBagStatus.DISCARDED) {
      throw new BadRequestException('当前状态下的血袋不可删除');
    }
    await this.bloodBagRepository.remove(bloodBag);
  }

  async confirmCrossMatch(dto: ConfirmCrossMatchDto): Promise<BloodBag[]> {
    const bags = await this.bloodBagRepository.find({
      where: { id: In(dto.bloodBagIds) },
    });

    if (bags.length !== dto.bloodBagIds.length) {
      throw new NotFoundException('部分血袋不存在');
    }

    const now = new Date();
    for (const bag of bags) {
      if (bag.status === BloodBagStatus.EXPIRED) {
        throw new BadRequestException(`血袋 ${bag.bagCode} 已过期，不可进行配血`);
      }
      if (bag.temperatureAlert) {
        throw new BadRequestException(`血袋 ${bag.bagCode} 存在温度异常，不可出库`);
      }
      bag.crossMatchConfirmed = true;
      bag.crossMatchTime = now;
      bag.crossMatchOperator = dto.operator;
    }

    return await this.bloodBagRepository.save(bags);
  }

  async allocateBloodBags(dto: AllocateBloodBagDto): Promise<BloodBag[]> {
    const lockToken = await this.redisLockService.acquireLock(
      `allocate:${dto.bloodType}:${dto.componentType}`,
      60,
    );

    try {
      const availableBags = await this.getAvailableBags(
        dto.bloodType,
        dto.componentType,
        dto.quantity,
      );

      if (availableBags.length < dto.quantity) {
        throw new BadRequestException(
          `库存不足，当前可用 ${dto.bloodType}${dto.componentType} 共 ${availableBags.length} 袋`,
        );
      }

      const allocatedBags: BloodBag[] = [];
      for (let i = 0; i < dto.quantity; i++) {
        const bag = availableBags[i];
        const preempted = await this.redisLockService.preemptBag(
          bag.id,
          dto.appointmentId,
        );

        if (!preempted) {
          continue;
        }

        bag.status = BloodBagStatus.PREEMPTED;
        bag.currentAppointmentId = dto.appointmentId;
        allocatedBags.push(await this.bloodBagRepository.save(bag));
      }

      if (allocatedBags.length < dto.quantity) {
        for (const bag of allocatedBags) {
          await this.redisLockService.releasePreempt(bag.id);
          bag.status = BloodBagStatus.IN_STOCK;
          bag.currentAppointmentId = null;
          await this.bloodBagRepository.save(bag);
        }
        throw new BadRequestException('部分血袋预占失败，请重试');
      }

      return allocatedBags;
    } finally {
      await this.redisLockService.releaseLock(
        `allocate:${dto.bloodType}:${dto.componentType}`,
        lockToken,
      );
    }
  }

  async getAvailableBags(
    bloodType: string,
    componentType: string,
    limit: number,
  ): Promise<BloodBag[]> {
    const now = new Date();
    const qb = this.bloodBagRepository.createQueryBuilder('bag');

    qb.where('bag.bloodType = :bloodType', { bloodType });
    qb.andWhere('bag.componentType = :componentType', { componentType });
    qb.andWhere('bag.status = :status', { status: BloodBagStatus.IN_STOCK });
    qb.andWhere('bag.expireDate > :now', { now });
    qb.andWhere('bag.temperatureAlert = :alert', { alert: false });

    qb.orderBy('bag.expireDate', 'ASC');
    qb.limit(limit);

    return await qb.getMany();
  }

  async getExpiringBags(): Promise<BloodBag[]> {
    const warnDays = this.configService.get<number>('BAG_EXPIRE_WARN_DAYS') ?? 7;
    const warnDate = new Date();
    warnDate.setDate(warnDate.getDate() + warnDays);

    return await this.bloodBagRepository.find({
      where: {
        expireDate: LessThanOrEqual(warnDate),
        status: In([BloodBagStatus.IN_STOCK, BloodBagStatus.PREEMPTED]),
      },
      order: { expireDate: 'ASC' },
    });
  }

  async checkAndMarkExpired(): Promise<number> {
    const now = new Date();
    const expiredBags = await this.bloodBagRepository.find({
      where: {
        expireDate: LessThanOrEqual(now),
        status: In([BloodBagStatus.IN_STOCK, BloodBagStatus.PREEMPTED]),
      },
    });

    for (const bag of expiredBags) {
      bag.status = BloodBagStatus.EXPIRED;
      await this.redisLockService.releasePreempt(bag.id);
    }

    if (expiredBags.length > 0) {
      await this.bloodBagRepository.save(expiredBags);
      this.logger.log(`标记过期血袋 ${expiredBags.length} 袋`);
    }

    return expiredBags.length;
  }

  async getInventoryStats() {
    const result = await this.bloodBagRepository
      .createQueryBuilder('bag')
      .select('bag.bloodType', 'bloodType')
      .addSelect('bag.componentType', 'componentType')
      .addSelect('bag.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('bag.bloodType')
      .addGroupBy('bag.componentType')
      .addGroupBy('bag.status')
      .getRawMany();

    return result;
  }

  async releasePreemptedBags(appointmentId: string): Promise<void> {
    const bags = await this.bloodBagRepository.find({
      where: {
        currentAppointmentId: appointmentId,
        status: BloodBagStatus.PREEMPTED,
      },
    });

    for (const bag of bags) {
      await this.redisLockService.releasePreempt(bag.id);
      bag.status = BloodBagStatus.IN_STOCK;
      bag.currentAppointmentId = null;
      await this.bloodBagRepository.save(bag);
    }
  }

  async updateBagStatus(ids: string[], status: BloodBagStatus): Promise<BloodBag[]> {
    const bags = await this.bloodBagRepository.find({
      where: { id: In(ids) },
    });

    for (const bag of bags) {
      bag.status = status;
    }

    return await this.bloodBagRepository.save(bags);
  }
}
