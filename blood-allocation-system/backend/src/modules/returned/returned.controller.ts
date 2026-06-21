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
import { ReturnedService } from './returned.service';
import {
  CreateReturnedBloodDto,
  InspectReturnedDto,
  QueryReturnedDto,
} from './dto/returned.dto';
import { ReturnedBlood } from './entities/returned-blood.entity';

@ApiTags('退回血处理')
@Controller('returned-bloods')
export class ReturnedController {
  constructor(private readonly returnedService: ReturnedService) {}

  @Post()
  @ApiOperation({ summary: '登记退回血' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReturnedBloodDto): Promise<ReturnedBlood> {
    return this.returnedService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询退回血列表（分页）' })
  findAll(@Query() query: QueryReturnedDto) {
    return this.returnedService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询退回血详情' })
  findOne(@Param('id') id: string): Promise<ReturnedBlood> {
    return this.returnedService.findOne(id);
  }

  @Get('no/:returnNo')
  @ApiOperation({ summary: '根据退回单号查询' })
  findByNo(@Param('returnNo') returnNo: string): Promise<ReturnedBlood> {
    return this.returnedService.findByNo(returnNo);
  }

  @Post(':id/inspect')
  @ApiOperation({ summary: '质量复检（判断重新入库或报废）' })
  inspect(
    @Param('id') id: string,
    @Body() dto: InspectReturnedDto,
  ): Promise<ReturnedBlood> {
    return this.returnedService.inspect(id, dto);
  }

  @Post(':id/re-inventory')
  @ApiOperation({ summary: '重新入库' })
  reInventory(
    @Param('id') id: string,
    @Body('operator') operator: string,
  ): Promise<ReturnedBlood> {
    return this.returnedService.reInventory(id, operator);
  }

  @Post(':id/discard')
  @ApiOperation({ summary: '报废处理' })
  discard(
    @Param('id') id: string,
    @Body() body: { operator: string; reason?: string },
  ): Promise<ReturnedBlood> {
    return this.returnedService.discard(id, body.operator, body.reason);
  }
}
