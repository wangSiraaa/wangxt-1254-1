import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { TemperatureStatus } from '../../../common/enums';

export class RecordTemperatureDto {
  @IsOptional()
  @IsUUID()
  handoverId?: string;

  @IsOptional()
  @IsUUID()
  bloodBagId?: string;

  @IsOptional()
  @IsString()
  coldChainDeviceCode?: string;

  @IsNotEmpty()
  @IsNumber()
  temperature: number;

  @IsOptional()
  @IsDateString()
  recordTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryTemperatureDto {
  @IsOptional()
  @IsUUID()
  handoverId?: string;

  @IsOptional()
  @IsUUID()
  bloodBagId?: string;

  @IsOptional()
  @IsString()
  coldChainDeviceCode?: string;

  @IsOptional()
  @IsEnum(TemperatureStatus)
  status?: TemperatureStatus;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}

export class CheckTemperatureDto {
  @IsNotEmpty()
  @IsNumber()
  temperature: number;
}
