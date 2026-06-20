import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Handover } from './handover.entity';

@Entity('handover_items')
export class HandoverItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'handover_id', type: 'uuid' })
  handoverId: string;

  @ManyToOne(() => Handover, (handover) => handover.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'handover_id' })
  handover: Handover;

  @Column({ name: 'blood_bag_id', type: 'uuid' })
  bloodBagId: string;

  @Column({ name: 'bag_code', type: 'varchar', length: 50 })
  bagCode: string;

  @Column({ name: 'scan_time', type: 'timestamp', nullable: true })
  scanTime: Date;

  @Column({ name: 'scan_operator', type: 'varchar', length: 50, nullable: true })
  scanOperator: string;

  @Column({ name: 'temperature_received', type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatureReceived: number;

  @Column({ name: 'temperature_alert', type: 'boolean', default: false })
  temperatureAlert: boolean;

  @Column({ name: 'accepted', type: 'boolean', default: true })
  accepted: boolean;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
