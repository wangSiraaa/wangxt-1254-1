import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BloodBagService } from './blood-bag.service';
import {
  CreateBloodBagDto,
  UpdateBloodBagDto,
  QueryBloodBagDto,
  ConfirmCrossMatchDto,
  AllocateBloodBagDto,
} from './dto/blood-bag.dto';
import { BloodBag } from './entities/blood-bag.entity';

@ApiTags('血袋管理')
@Controller('blood-bags')
export class BloodBagController {
  constructor(private readonly bloodBagService: BloodBagService) {}

  @Post()
  @ApiOperation({ summary: '新增血袋入库' })
  @ApiResponse({ status: 201, description: '创建成功', type: BloodBag })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateBloodBagDto): Promise<BloodBag> {
    return this.bloodBagService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '查询血袋列表（分页）' })
  findAll(@Query() query: QueryBloodBagDto) {
    return this.bloodBagService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取库存统计' })
  getStats() {
    return this.bloodBagService.getInventoryStats();
  }

  @Get('expiring')
  @ApiOperation({ summary: '获取临近效期血袋列表' })
  getExpiring(): Promise<BloodBag[]> {
    return this.bloodBagService.getExpiringBags();
  }

  @Get('code/:bagCode')
  @ApiOperation({ summary: '根据血袋编号查询' })
  findByBagCode(@Param('bagCode') bagCode: string): Promise<BloodBag> {
    return this.bloodBagService.findByBagCode(bagCode);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询血袋详情' })
  findOne(@Param('id') id: string): Promise<BloodBag> {
    return this.bloodBagService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新血袋信息' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBloodBagDto,
  ): Promise<BloodBag> {
    return this.bloodBagService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除血袋' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.bloodBagService.remove(id);
  }

  @Post('cross-match/confirm')
  @ApiOperation({ summary: '批量确认交叉配血' })
  confirmCrossMatch(@Body() dto: ConfirmCrossMatchDto): Promise<BloodBag[]> {
    return this.bloodBagService.confirmCrossMatch(dto);
  }

  @Post('allocate')
  @ApiOperation({ summary: '分配血袋到预约单（带Redis预占锁）' })
  allocate(@Body() dto: AllocateBloodBagDto): Promise<BloodBag[]> {
    return this.bloodBagService.allocateBloodBags(dto);
  }

  @Post('check-expired')
  @ApiOperation({ summary: '检查并标记过期血袋' })
  checkExpired(): Promise<{ count: number }> {
    return this.bloodBagService.checkAndMarkExpired().then((count) => ({ count }));
  }
}
