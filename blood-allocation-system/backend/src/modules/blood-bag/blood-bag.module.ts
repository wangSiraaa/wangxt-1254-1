import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodBag } from './entities/blood-bag.entity';
import { BloodBagService } from './blood-bag.service';
import { BloodBagController } from './blood-bag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BloodBag])],
  controllers: [BloodBagController],
  providers: [BloodBagService],
  exports: [BloodBagService],
})
export class BloodBagModule {}
