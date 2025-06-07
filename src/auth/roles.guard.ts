import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const route = context.getHandler().name; // e.g., createRole, findAll
    const method = request.method; // e.g., POST, GET
    const path = request.route.path; // e.g., /roles, /todos

    if (!user || !user.roleId) {
      throw new ForbiddenException('User or role not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });

    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    // Restrict role creation to admin only
    if (path.startsWith('/roles') && method === 'POST' && route === 'createRole') {
      if (role.name !== 'admin') {
        throw new ForbiddenException('Only admins can create roles');
      }
      return true;
    }

    const permissions = await this.prisma.permission.findMany({
      where: { roleId: user.roleId },
    });

    const permissionNames = permissions.map((p) => p.name);

    // Define required permissions based on route and method
    const requiredPermissions: { [key: string]: string[] } = {
      create: ['todo:write', 'todo:write-all'],
      findAll: ['todo:read', 'todo:read-all'],
      findOne: ['todo:read', 'todo:read-all'],
      update: ['todo:write', 'todo:write-all'],
      delete: ['todo:delete', 'todo:delete-all'],
    };

    const required = requiredPermissions[route] || [];
    const hasPermission = required.some((perm) => permissionNames.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // For routes that check ownership (create, update, delete own todos)
    if (route === 'create') {
      request.todoOwnerId = user.id; // Set owner for new todo
      return true;
    }

    if (['update', 'delete'].includes(route) && !permissionNames.includes(`todo:${route}-all`)) {
      const todoId = parseInt(request.params.id, 10);
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo || (todo.userId !== user.id && !permissionNames.includes(`todo:${route}-all`))) {
        throw new ForbiddenException('You can only modify your own todos');
      }
    }

    if (route === 'findOne' && !permissionNames.includes('todo:read-all')) {
      const todoId = parseInt(request.params.id, 10);
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo || (todo.userId !== user.id && !permissionNames.includes('todo:read-all'))) {
        throw new ForbiddenException('You can only view your own todos');
      }
    }

    return true;
  }
}