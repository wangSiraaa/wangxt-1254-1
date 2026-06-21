import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, IsArray, IsNumber, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HandoverStatus, HandoverType } from '../../../common/enums';

class ScanBagItemDto {
  @IsNotEmpty()
  @IsString()
  bagCode: string;

  @IsOptional()
  @IsNumber()
  temperatureReceived?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateHandoverDto {
  @IsNotEmpty()
  @IsEnum(HandoverType)
  handoverType: HandoverType;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsNotEmpty()
  @IsString()
  hospitalCode: string;

  @IsNotEmpty()
  @IsString()
  hospitalName: string;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  vehicleNo?: string;

  @IsOptional()
  @IsString()
  coldChainDeviceCode?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanBagItemDto)
  scannedBags?: ScanBagItemDto[];
}

export class ScanBagDto {
  @IsNotEmpty()
  @IsString()
  bagCode: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsNotEmpty()
  @IsString()
  operator: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class DispatchHandoverDto {
  @IsNotEmpty()
  @IsString()
  dispatcherName: string;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  vehicleNo?: string;
}

export class ReceiveHandoverDto {
  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsNotEmpty()
  @IsString()
  hospitalCode: string;
}

export class RejectHandoverDto {
  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ReceiveItemDto {
  @IsNotEmpty()
  @IsUUID()
  handoverItemId: string;

  @IsNotEmpty()
  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsNumber()
  temperatureReceived?: number;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class BatchReceiveDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];

  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsNotEmpty()
  @IsString()
  hospitalCode: string;
}

export class QueryHandoverDto {
  @IsOptional()
  @IsEnum(HandoverStatus)
  status?: HandoverStatus;

  @IsOptional()
  @IsEnum(HandoverType)
  handoverType?: HandoverType;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  hospitalCode?: string;

  @IsOptional()
  @IsString()
  handoverNo?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}
