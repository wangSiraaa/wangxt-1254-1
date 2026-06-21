import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BloodType, BloodComponentType, BloodBagStatus } from '../../common/enums';

@Entity('blood_bags')
@Index(['bagCode'], { unique: true })
@Index(['bloodType', 'componentType', 'status'])
export class BloodBag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bag_code', type: 'varchar', length: 50, unique: true })
  bagCode: string;

  @Column({
    name: 'blood_type',
    type: 'enum',
    enum: BloodType,
  })
  bloodType: BloodType;

  @Column({
    name: 'component_type',
    type: 'enum',
    enum: BloodComponentType,
  })
  componentType: BloodComponentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  volume: number;

  @Column({ name: 'batch_no', type: 'varchar', length: 50 })
  batchNo: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BloodBagStatus,
    default: BloodBagStatus.IN_STOCK,
  })
  status: BloodBagStatus;

  @Column({ name: 'collect_date', type: 'timestamp' })
  collectDate: Date;

  @Column({ name: 'expire_date', type: 'timestamp' })
  expireDate: Date;

  @Column({ name: 'collect_station', type: 'varchar', length: 100, nullable: true })
  collectStation: string;

  @Column({ name: 'donor_code', type: 'varchar', length: 50, nullable: true })
  donorCode: string;

  @Column({ name: 'storage_location', type: 'varchar', length: 100, nullable: true })
  storageLocation: string;

  @Column({ name: 'current_appointment_id', type: 'uuid', nullable: true })
  currentAppointmentId: string;

  @Column({ name: 'current_handover_id', type: 'uuid', nullable: true })
  currentHandoverId: string;

  @Column({ name: 'cross_match_confirmed', type: 'boolean', default: false })
  crossMatchConfirmed: boolean;

  @Column({ name: 'cross_match_time', type: 'timestamp', nullable: true })
  crossMatchTime: Date;

  @Column({ name: 'cross_match_operator', type: 'varchar', length: 50, nullable: true })
  crossMatchOperator: string;

  @Column({ name: 'temperature_alert', type: 'boolean', default: false })
  temperatureAlert: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true })
  updatedBy: string;
}
