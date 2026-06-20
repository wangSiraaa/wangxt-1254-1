import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemperatureRecord } from './entities/temperature-record.entity';
import { TemperatureService } from './temperature.service';
import { TemperatureController } from './temperature.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TemperatureRecord])],
  controllers: [TemperatureController],
  providers: [TemperatureService],
  exports: [TemperatureService],
})
export class TemperatureModule {}
