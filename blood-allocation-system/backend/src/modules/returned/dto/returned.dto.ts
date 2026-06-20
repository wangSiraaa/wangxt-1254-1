import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ReturnReason, ReturnedStatus } from '../../../common/enums';

export class CreateReturnedBloodDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  handoverId?: string;

  @IsNotEmpty()
  @IsString()
  hospitalCode: string;

  @IsNotEmpty()
  @IsString()
  hospitalName: string;

  @IsNotEmpty()
  @IsUUID()
  bloodBagId: string;

  @IsNotEmpty()
  @IsString()
  bagCode: string;

  @IsNotEmpty()
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsNotEmpty()
  @IsDateString()
  returnTime: string;

  @IsNotEmpty()
  @IsString()
  returnOperator: string;

  @IsOptional()
  @IsNumber()
  returnTemperature?: number;

  @IsOptional()
  @IsBoolean()
  packageIntact?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class InspectReturnedDto {
  @IsNotEmpty()
  @IsString()
  inspectionResult: string;

  @IsNotEmpty()
  @IsString()
  operator: string;

  @IsEnum(ReturnedStatus)
  finalStatus: ReturnedStatus;
}

export class QueryReturnedDto {
  @IsOptional()
  @IsEnum(ReturnedStatus)
  status?: ReturnedStatus;

  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @IsOptional()
  @IsString()
  hospitalCode?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  bagCode?: string;

  @IsOptional()
  @IsString()
  returnNo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
