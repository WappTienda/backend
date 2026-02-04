import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Category } from './entities/category.entity';
import { Public } from '../../common/decorators';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active categories (public)' })
  @ApiResponse({ status: 200, type: [Category] })
  async findAllPublic(): Promise<Category[]> {
    return this.categoriesService.findAll(true);
  }

  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories (admin)' })
  @ApiResponse({ status: 200, type: [Category] })
  async findAllAdmin(): Promise<Category[]> {
    return this.categoriesService.findAll(false);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categoriesService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin)' })
  @ApiResponse({ status: 201, type: Category })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin)' })
  @ApiResponse({ status: 200, type: Category })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (admin)' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.delete(id);
  }
}
