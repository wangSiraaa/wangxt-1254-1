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
import { HandoverService } from './handover.service';
import {
  CreateHandoverDto,
  ScanBagDto,
  DispatchHandoverDto,
  ReceiveHandoverDto,
  RejectHandoverDto,
  BatchReceiveDto,
  QueryHandoverDto,
} from './dto/handover.dto';
import { Handover } from './entities/handover.entity';
import { HandoverItem } from './entities/handover-item.entity';

@ApiTags('冷链交接')
@Controller('handovers')
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  @Post()
  @ApiOperation({ summary: '创建交接单（冷链出库）' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateHandoverDto): Promise<Handover> {
    return this.handoverService.create(createDto);
  }

  @Post(':id/scan')
  @ApiOperation({ summary: '扫码添加血袋到交接单' })
  scanBag(
    @Param('id') id: string,
    @Body() dto: ScanBagDto,
  ): Promise<HandoverItem> {
    return this.handoverService.scanBag(id, dto);
  }

  @Get()
  @ApiOperation({ summary: '查询交接单列表（分页）' })
  findAll(@Query() query: QueryHandoverDto) {
    return this.handoverService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询交接单详情' })
  findOne(@Param('id') id: string): Promise<Handover> {
    return this.handoverService.findOne(id);
  }

  @Get('no/:handoverNo')
  @ApiOperation({ summary: '根据交接单号查询' })
  findByNo(@Param('handoverNo') handoverNo: string): Promise<Handover> {
    return this.handoverService.findByNo(handoverNo);
  }

  @Post(':id/dispatch')
  @ApiOperation({ summary: '发运交接单' })
  dispatch(
    @Param('id') id: string,
    @Body() dto: DispatchHandoverDto,
  ): Promise<Handover> {
    return this.handoverService.dispatch(id, dto);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '医院接收交接单（整体接收/拒收）' })
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveHandoverDto,
  ): Promise<Handover> {
    return this.handoverService.receive(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '医院拒收交接单' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectHandoverDto,
  ): Promise<Handover> {
    return this.handoverService.reject(id, dto);
  }

  @Post(':id/batch-receive')
  @ApiOperation({ summary: '逐袋接收交接单（温度超限的血袋不能被接收）' })
  batchReceive(
    @Param('id') id: string,
    @Body() dto: BatchReceiveDto,
  ): Promise<Handover> {
    return this.handoverService.batchReceive(id, dto);
  }
}
