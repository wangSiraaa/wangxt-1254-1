import { IsNotEmpty, IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { BloodType, BloodComponentType, BloodBagStatus } from '../../../common/enums';

export class CreateBloodBagDto {
  @IsNotEmpty()
  @IsString()
  bagCode: string;

  @IsNotEmpty()
  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsNotEmpty()
  @IsEnum(BloodComponentType)
  componentType: BloodComponentType;

  @IsNotEmpty()
  @IsNumber()
  volume: number;

  @IsNotEmpty()
  @IsString()
  batchNo: string;

  @IsNotEmpty()
  @IsDateString()
  collectDate: string;

  @IsNotEmpty()
  @IsDateString()
  expireDate: string;

  @IsOptional()
  @IsString()
  collectStation?: string;

  @IsOptional()
  @IsString()
  donorCode?: string;

  @IsOptional()
  @IsString()
  storageLocation?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateBloodBagDto {
  @IsOptional()
  @IsEnum(BloodBagStatus)
  status?: BloodBagStatus;

  @IsOptional()
  @IsString()
  storageLocation?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryBloodBagDto {
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsEnum(BloodComponentType)
  componentType?: BloodComponentType;

  @IsOptional()
  @IsEnum(BloodBagStatus)
  status?: BloodBagStatus;

  @IsOptional()
  @IsString()
  bagCode?: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  expiringSoon?: boolean;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}

export class ConfirmCrossMatchDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  bloodBagIds: string[];

  @IsNotEmpty()
  @IsString()
  operator: string;
}

export class AllocateBloodBagDto {
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  @IsNotEmpty()
  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsNotEmpty()
  @IsEnum(BloodComponentType)
  componentType: BloodComponentType;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
