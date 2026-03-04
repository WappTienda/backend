import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from '../../../domain/services/customers-domain.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../../../application/dto';
import { CustomerModel } from '../../../domain/models/customer.model';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from '../../../../../common/dto';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers (admin)' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CustomerModel>> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID with orders (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CustomerModel> {
    return this.customersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer (admin)' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerModel> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerModel> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a customer (admin)' })
  @ApiResponse({ status: 204, description: 'Customer deactivated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customersService.delete(id);
  }
}
