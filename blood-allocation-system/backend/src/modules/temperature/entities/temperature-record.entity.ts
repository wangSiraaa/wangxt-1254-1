import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TemperatureStatus } from '../../../common/enums';

@Entity('temperature_records')
@Index(['handoverId', 'recordTime'])
@Index(['bloodBagId', 'recordTime'])
export class TemperatureRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'handover_id', type: 'uuid', nullable: true })
  handoverId: string;

  @Column({ name: 'blood_bag_id', type: 'uuid', nullable: true })
  bloodBagId: string;

  @Column({ name: 'cold_chain_device_code', type: 'varchar', length: 50, nullable: true })
  coldChainDeviceCode: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperature: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TemperatureStatus,
    default: TemperatureStatus.NORMAL,
  })
  status: TemperatureStatus;

  @Column({ name: 'record_time', type: 'timestamp' })
  recordTime: Date;

  @Column({ name: 'location', type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
