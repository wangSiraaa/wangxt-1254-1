import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnedBlood } from './entities/returned-blood.entity';
import { BloodBag } from '../blood-bag/entities/blood-bag.entity';
import { ReturnedService } from './returned.service';
import { ReturnedController } from './returned.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnedBlood, BloodBag])],
  controllers: [ReturnedController],
  providers: [ReturnedService],
  exports: [ReturnedService],
})
export class ReturnedModule {}
