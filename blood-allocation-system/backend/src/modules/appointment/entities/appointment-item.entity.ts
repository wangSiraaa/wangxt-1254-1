import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { BloodType, BloodComponentType } from '../../../common/enums';

@Entity('appointment_items')
export class AppointmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

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

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  volumePerUnit: number;

  @Column({ name: 'allocated_quantity', type: 'int', default: 0 })
  allocatedQuantity: number;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
