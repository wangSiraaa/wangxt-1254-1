import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus, UrgencyLevel, BloodType, BloodComponentType } from '../../../common/enums';

class AppointmentItemDto {
  @IsNotEmpty()
  @IsEnum(BloodType)
  bloodType: BloodType;

  @IsNotEmpty()
  @IsEnum(BloodComponentType)
  componentType: BloodComponentType;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  volumePerUnit?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  hospitalCode: string;

  @IsNotEmpty()
  @IsString()
  hospitalName: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsNotEmpty()
  @IsEnum(UrgencyLevel)
  urgencyLevel: UrgencyLevel;

  @IsNotEmpty()
  @IsDateString()
  expectedUseDate: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsBoolean()
  crossMatchRequired?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentItemDto)
  items: AppointmentItemDto[];
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class QueryAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  hospitalCode?: string;

  @IsOptional()
  @IsString()
  appointmentNo?: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}

export class ApproveAppointmentDto {
  @IsNotEmpty()
  @IsString()
  operator: string;
}

export class RejectAppointmentDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  operator: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
