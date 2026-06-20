import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TemperatureRecord } from './entities/temperature-record.entity';
import { RecordTemperatureDto, QueryTemperatureDto, CheckTemperatureDto } from './dto/temperature.dto';
import { TemperatureStatus } from '../../common/enums';

@Injectable()
export class TemperatureService {
  private readonly logger = new Logger(TemperatureService.name);

  constructor(
    @InjectRepository(TemperatureRecord)
    private readonly temperatureRepository: Repository<TemperatureRecord>,
    private readonly configService: ConfigService,
  ) {}

  private getMinTemp(): number {
    return this.configService.get<number>('COLD_CHAIN_MIN_TEMP', 2);
  }

  private getMaxTemp(): number {
    return this.configService.get<number>('COLD_CHAIN_MAX_TEMP', 6);
  }

  private determineStatus(temperature: number): TemperatureStatus {
    const min = this.getMinTemp();
    const max = this.getMaxTemp();
    const warningRange = 0.5;

    if (temperature < min || temperature > max) {
      return TemperatureStatus.OVER_LIMIT;
    }
    if (
      temperature < min + warningRange ||
      temperature > max - warningRange
    ) {
      return TemperatureStatus.WARNING;
    }
    return TemperatureStatus.NORMAL;
  }

  checkTemperature(dto: CheckTemperatureDto): {
    status: TemperatureStatus;
    normal: boolean;
    message: string;
    min: number;
    max: number;
  } {
    const status = this.determineStatus(dto.temperature);
    const min = this.getMinTemp();
    const max = this.getMaxTemp();
    const normal = status === TemperatureStatus.NORMAL;
    let message = '温度正常';
    if (status === TemperatureStatus.WARNING) {
      message = '温度接近警戒值';
    } else if (status === TemperatureStatus.OVER_LIMIT) {
      message = `温度超限！冷链温度应在 ${min}°C ~ ${max}°C`;
    }
    return { status, normal, message, min, max };
  }

  async recordTemperature(dto: RecordTemperatureDto): Promise<TemperatureRecord> {
    const status = this.determineStatus(dto.temperature);
    const record = this.temperatureRepository.create({
      ...dto,
      recordTime: dto.recordTime ? new Date(dto.recordTime) : new Date(),
      status,
    });

    const saved = await this.temperatureRepository.save(record);

    if (status === TemperatureStatus.OVER_LIMIT) {
      this.logger.warn(
        `温度超限告警: ${dto.temperature}°C, 血袋: ${dto.bloodBagId || '未知'}, 交接单: ${dto.handoverId || '未知'}`,
      );
    }

    return saved;
  }

  async batchRecord(records: RecordTemperatureDto[]): Promise<TemperatureRecord[]> {
    const entities = records.map((dto) =>
      this.temperatureRepository.create({
        ...dto,
        recordTime: dto.recordTime ? new Date(dto.recordTime) : new Date(),
        status: this.determineStatus(dto.temperature),
      }),
    );
    return await this.temperatureRepository.save(entities);
  }

  async findAll(query: QueryTemperatureDto) {
    const {
      handoverId,
      bloodBagId,
      coldChainDeviceCode,
      status,
      startTime,
      endTime,
      page = 1,
      pageSize = 50,
    } = query;

    const qb = this.temperatureRepository.createQueryBuilder('t');

    if (handoverId) {
      qb.andWhere('t.handoverId = :handoverId', { handoverId });
    }
    if (bloodBagId) {
      qb.andWhere('t.bloodBagId = :bloodBagId', { bloodBagId });
    }
    if (coldChainDeviceCode) {
      qb.andWhere('t.coldChainDeviceCode = :coldChainDeviceCode', {
        coldChainDeviceCode,
      });
    }
    if (status) {
      qb.andWhere('t.status = :status', { status });
    }
    if (startTime && endTime) {
      qb.andWhere('t.recordTime BETWEEN :startTime AND :endTime', {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
    }

    qb.orderBy('t.recordTime', 'DESC');

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

  async getRecordsByHandover(handoverId: string): Promise<TemperatureRecord[]> {
    return await this.temperatureRepository.find({
      where: { handoverId },
      order: { recordTime: 'ASC' },
    });
  }

  async getRecordsByBloodBag(bloodBagId: string): Promise<TemperatureRecord[]> {
    return await this.temperatureRepository.find({
      where: { bloodBagId },
      order: { recordTime: 'ASC' },
    });
  }

  async getAlertRecords(
    startTime?: string,
    endTime?: string,
  ): Promise<TemperatureRecord[]> {
    const where: any = {
      status: TemperatureStatus.OVER_LIMIT,
    };

    if (startTime && endTime) {
      where.recordTime = Between(new Date(startTime), new Date(endTime));
    }

    return await this.temperatureRepository.find({
      where,
      order: { recordTime: 'DESC' },
    });
  }

  async getHandoverTemperatureSummary(handoverId: string): Promise<{
    min: number;
    max: number;
    avg: number;
    count: number;
    alertCount: number;
    hasOverLimit: boolean;
  }> {
    const records = await this.getRecordsByHandover(handoverId);

    if (records.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
        alertCount: 0,
        hasOverLimit: false,
      };
    }

    const temperatures = records.map((r) => Number(r.temperature));
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const alertCount = records.filter(
      (r) => r.status === TemperatureStatus.OVER_LIMIT,
    ).length;

    return {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      avg: Number(avg.toFixed(2)),
      count: records.length,
      alertCount,
      hasOverLimit: alertCount > 0,
    };
  }
}
