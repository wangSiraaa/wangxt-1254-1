import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentItem } from './entities/appointment-item.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { BloodBagModule } from '../blood-bag/blood-bag.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentItem]), BloodBagModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
