import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AppointmentItem } from './appointment-item.entity';
import { AppointmentStatus, UrgencyLevel } from '../../../common/enums';

@Entity('appointments')
@Index(['hospitalCode', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_no', type: 'varchar', length: 50, unique: true })
  appointmentNo: string;

  @Column({ name: 'hospital_code', type: 'varchar', length: 50 })
  hospitalCode: string;

  @Column({ name: 'hospital_name', type: 'varchar', length: 200 })
  hospitalName: string;

  @Column({ name: 'department', type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ name: 'doctor_name', type: 'varchar', length: 50, nullable: true })
  doctorName: string;

  @Column({ name: 'patient_name', type: 'varchar', length: 50, nullable: true })
  patientName: string;

  @Column({ name: 'patient_id', type: 'varchar', length: 50, nullable: true })
  patientId: string;

  @Column({
    name: 'urgency_level',
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgencyLevel: UrgencyLevel;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ name: 'expected_use_date', type: 'timestamp' })
  expectedUseDate: Date;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'cross_match_required', type: 'boolean', default: true })
  crossMatchRequired: boolean;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @OneToMany(() => AppointmentItem, (item) => item.appointment, {
    cascade: true,
    eager: true,
  })
  items: AppointmentItem[];

  @Column({ name: 'approved_by', type: 'varchar', length: 50, nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_time', type: 'timestamp', nullable: true })
  approvedTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true })
  updatedBy: string;
}
