import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { HandoverItem } from './handover-item.entity';
import { HandoverStatus, HandoverType } from '../../../common/enums';

@Entity('handovers')
@Index(['handoverNo'], { unique: true })
@Index(['appointmentId', 'status'])
export class Handover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'handover_no', type: 'varchar', length: 50, unique: true })
  handoverNo: string;

  @Column({
    name: 'handover_type',
    type: 'enum',
    enum: HandoverType,
    default: HandoverType.OUTBOUND,
  })
  handoverType: HandoverType;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ name: 'hospital_code', type: 'varchar', length: 50 })
  hospitalCode: string;

  @Column({ name: 'hospital_name', type: 'varchar', length: 200 })
  hospitalName: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: HandoverStatus,
    default: HandoverStatus.PENDING,
  })
  status: HandoverStatus;

  @Column({ name: 'dispatcher_name', type: 'varchar', length: 50, nullable: true })
  dispatcherName: string;

  @Column({ name: 'dispatcher_time', type: 'timestamp', nullable: true })
  dispatcherTime: Date;

  @Column({ name: 'courier_name', type: 'varchar', length: 50, nullable: true })
  courierName: string;

  @Column({ name: 'vehicle_no', type: 'varchar', length: 30, nullable: true })
  vehicleNo: string;

  @Column({ name: 'cold_chain_device_code', type: 'varchar', length: 50, nullable: true })
  coldChainDeviceCode: string;

  @Column({ name: 'receiver_name', type: 'varchar', length: 50, nullable: true })
  receiverName: string;

  @Column({ name: 'receive_time', type: 'timestamp', nullable: true })
  receiveTime: Date;

  @Column({ name: 'receive_hospital_code', type: 'varchar', length: 50, nullable: true })
  receiveHospitalCode: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => HandoverItem, (item) => item.handover, {
    cascade: true,
    eager: true,
  })
  items: HandoverItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true })
  updatedBy: string;
}
