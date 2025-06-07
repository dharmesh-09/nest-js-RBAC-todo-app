import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { Todo } from '../../generated/prisma';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User as PrismaUser } from '../../generated/prisma';

interface User extends PrismaUser {
  role: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Controller('todos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  async create(@Body() body: { title: string }, @GetUser() user: User): Promise<Todo> {
    return this.todosService.create(body.title, user.id);
  }

  @Get()
  async findAll(@GetUser() user: User): Promise<Todo[]> {
    return this.todosService.findAll(user.id, user.role.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<Todo | null> {
    return this.todosService.findOne(id, user.id, user.role.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; completed?: boolean },
    @GetUser() user: User,
  ): Promise<Todo> {
    return this.todosService.update(id, body, user.id, user.role.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<Todo> {
    return this.todosService.delete(id, user.id, user.role.id);
  }
}