import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodBagModule } from './modules/blood-bag/blood-bag.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { HandoverModule } from './modules/handover/handover.module';
import { TemperatureModule } from './modules/temperature/temperature.module';
import { ReturnedModule } from './modules/returned/returned.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'blood_allocation'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    BloodBagModule,
    AppointmentModule,
    HandoverModule,
    TemperatureModule,
    ReturnedModule,
  ],
})
export class AppModule {}
