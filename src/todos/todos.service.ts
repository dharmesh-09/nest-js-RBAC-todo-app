import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Todo } from '../../generated/prisma';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(title: string, userId: number): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        title,
        completed: false,
        userId,
      },
    });
  }

  async findAll(userId: number, roleId: number): Promise<Todo[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { roleId },
      select: { name: true },
    });
    const hasReadAll = permissions.some((p) => p.name === 'todo:read-all');
    
    if (hasReadAll) {
      return this.prisma.todo.findMany();
    }
    return this.prisma.todo.findMany({ where: { userId } });
  }

  async findOne(id: number, userId: number, roleId: number): Promise<Todo | null> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return null;
    }
    const permissions = await this.prisma.permission.findMany({
      where: { roleId },
      select: { name: true },
    });
    const hasReadAll = permissions.some((p) => p.name === 'todo:read-all');
    
    if (hasReadAll) {
      return todo;
    }
    if (todo.userId !== userId) {
      throw new UnauthorizedException('You can only view your own todos');
    }
    return todo;
  }

  async update(id: number, data: Partial<Todo>, userId: number, roleId: number): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      throw new UnauthorizedException('Todo not found');
    }
    const permissions = await this.prisma.permission.findMany({
      where: { roleId },
      select: { name: true },
    });
    const hasWriteAll = permissions.some((p) => p.name === 'todo:write-all');
    
    if (hasWriteAll) {
      return this.prisma.todo.update({ where: { id }, data });
    }
    if (todo.userId !== userId) {
      throw new UnauthorizedException('You can only update your own todos');
    }
    return this.prisma.todo.update({ where: { id }, data });
  }

  async delete(id: number, userId: number, roleId: number): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      throw new UnauthorizedException('Todo not found');
    }
    const permissions = await this.prisma.permission.findMany({
      where: { roleId },
      select: { name: true },
    });
    const hasDeleteAll = permissions.some((p) => p.name === 'todo:delete-all');
    
    if (hasDeleteAll) {
      return this.prisma.todo.delete({ where: { id } });
    }
    if (todo.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own todos');
    }
    return this.prisma.todo.delete({ where: { id } });
  }
}