import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentDto,
  ApproveAppointmentDto,
  RejectAppointmentDto,
  CancelAppointmentDto,
} from './dto/appointment.dto';
import { Appointment } from './entities/appointment.entity';

@ApiTags('预约管理')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: '医院提交用血预约' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '查询预约列表（分页）' })
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询预约详情' })
  findOne(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentService.findOne(id);
  }

  @Get('no/:appointmentNo')
  @ApiOperation({ summary: '根据预约单号查询' })
  findByNo(@Param('appointmentNo') appointmentNo: string): Promise<Appointment> {
    return this.appointmentService.findByNo(appointmentNo);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新预约信息' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.update(id, updateDto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过预约' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.approve(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '驳回预约' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.reject(id, dto);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: '为预约分配血袋（自动匹配血型批号，临近效期优先）' })
  allocate(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentService.allocateBags(id);
  }

  @Post(':id/cross-match/confirm')
  @ApiOperation({ summary: '确认交叉配血完成' })
  confirmCrossMatch(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentService.confirmCrossMatch(id);
  }

  @Post(':id/cross-match/fail')
  @ApiOperation({ summary: '标记交叉配血失败' })
  failCrossMatch(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<Appointment> {
    return this.appointmentService.failCrossMatch(id, reason);
  }

  @Post(':id/ready-for-delivery')
  @ApiOperation({ summary: '标记待发货出库（交叉配血未确认不能出库）' })
  markReady(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentService.markReadyForDelivery(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消预约' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentService.cancel(id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成预约' })
  complete(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentService.complete(id);
  }
}
