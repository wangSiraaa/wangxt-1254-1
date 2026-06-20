import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Handover } from './entities/handover.entity';
import { HandoverItem } from './entities/handover-item.entity';
import { BloodBag } from '../blood-bag/entities/blood-bag.entity';
import { HandoverService } from './handover.service';
import { HandoverController } from './handover.controller';
import { AppointmentModule } from '../appointment/appointment.module';
import { TemperatureModule } from '../temperature/temperature.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Handover, HandoverItem, BloodBag]),
    AppointmentModule,
    TemperatureModule,
  ],
  controllers: [HandoverController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}
