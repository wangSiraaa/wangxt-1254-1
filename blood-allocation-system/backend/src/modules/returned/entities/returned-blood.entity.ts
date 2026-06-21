import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ReturnedStatus, ReturnReason } from '../../../common/enums';

@Entity('returned_bloods')
@Index(['returnNo'], { unique: true })
@Index(['appointmentId'])
export class ReturnedBlood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'return_no', type: 'varchar', length: 50, unique: true })
  returnNo: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ name: 'handover_id', type: 'uuid', nullable: true })
  handoverId: string;

  @Column({ name: 'hospital_code', type: 'varchar', length: 50 })
  hospitalCode: string;

  @Column({ name: 'hospital_name', type: 'varchar', length: 200 })
  hospitalName: string;

  @Column({ name: 'blood_bag_id', type: 'uuid' })
  bloodBagId: string;

  @Column({ name: 'bag_code', type: 'varchar', length: 50 })
  bagCode: string;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: ReturnReason,
    default: ReturnReason.NOT_USED,
  })
  reason: ReturnReason;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ReturnedStatus,
    default: ReturnedStatus.PENDING,
  })
  status: ReturnedStatus;

  @Column({ name: 'return_time', type: 'timestamp' })
  returnTime: Date;

  @Column({ name: 'return_operator', type: 'varchar', length: 50 })
  returnOperator: string;

  @Column({ name: 'return_temperature', type: 'decimal', precision: 5, scale: 2, nullable: true })
  returnTemperature: number;

  @Column({ name: 'package_intact', type: 'boolean', default: true })
  packageIntact: boolean;

  @Column({ name: 'inspection_result', type: 'text', nullable: true })
  inspectionResult: string;

  @Column({ name: 'inspection_time', type: 'timestamp', nullable: true })
  inspectionTime: Date;

  @Column({ name: 'inspection_operator', type: 'varchar', length: 50, nullable: true })
  inspectionOperator: string;

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
