import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemperatureService } from './temperature.service';
import {
  RecordTemperatureDto,
  QueryTemperatureDto,
  CheckTemperatureDto,
} from './dto/temperature.dto';
import { TemperatureRecord } from './entities/temperature-record.entity';

@ApiTags('温度监控')
@Controller('temperatures')
export class TemperatureController {
  constructor(private readonly temperatureService: TemperatureService) {}

  @Post('check')
  @ApiOperation({ summary: '校验温度是否在冷链范围内' })
  check(@Body() dto: CheckTemperatureDto) {
    return this.temperatureService.checkTemperature(dto);
  }

  @Post()
  @ApiOperation({ summary: '记录冷链温度' })
  @HttpCode(HttpStatus.CREATED)
  record(@Body() dto: RecordTemperatureDto): Promise<TemperatureRecord> {
    return this.temperatureService.recordTemperature(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量记录温度' })
  @HttpCode(HttpStatus.CREATED)
  batchRecord(@Body() records: RecordTemperatureDto[]): Promise<TemperatureRecord[]> {
    return this.temperatureService.batchRecord(records);
  }

  @Get()
  @ApiOperation({ summary: '查询温度记录（分页）' })
  findAll(@Query() query: QueryTemperatureDto) {
    return this.temperatureService.findAll(query);
  }

  @Get('handover/:handoverId')
  @ApiOperation({ summary: '查询交接单的温度记录' })
  getByHandover(@Param('handoverId') handoverId: string): Promise<TemperatureRecord[]> {
    return this.temperatureService.getRecordsByHandover(handoverId);
  }

  @Get('blood-bag/:bloodBagId')
  @ApiOperation({ summary: '查询血袋的温度记录' })
  getByBloodBag(@Param('bloodBagId') bloodBagId: string): Promise<TemperatureRecord[]> {
    return this.temperatureService.getRecordsByBloodBag(bloodBagId);
  }

  @Get('handover/:handoverId/summary')
  @ApiOperation({ summary: '获取交接单温度汇总统计' })
  getSummary(@Param('handoverId') handoverId: string) {
    return this.temperatureService.getHandoverTemperatureSummary(handoverId);
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取温度超限告警记录' })
  getAlerts(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ): Promise<TemperatureRecord[]> {
    return this.temperatureService.getAlertRecords(startTime, endTime);
  }
}
