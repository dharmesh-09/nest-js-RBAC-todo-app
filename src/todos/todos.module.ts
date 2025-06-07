import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [TodosController],
  providers: [TodosService, PrismaService, RolesGuard],
})
export class TodosModule {}