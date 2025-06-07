import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Permission } from '../../generated/prisma';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(name: string, permissionNames: string[]): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      throw new ConflictException(`Role '${name}' already exists`);
    }

    // Validate permissions
    const validPermissions = ['todo:read', 'todo:write', 'todo:delete', 'todo:read-all', 'todo:write-all', 'todo:delete-all'];
    const invalidPermissions = permissionNames.filter((p) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Create role and assign permissions
    return this.prisma.role.create({
      data: {
        name,
        permissions: {
          create: permissionNames.map((name) => ({ name })),
        },
      },
      include: { permissions: true },
    });
  }

  async assignPermission(roleName: string, permissionName: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if permission already assigned
    const existingPermission = await this.prisma.permission.findFirst({
      where: { name: permissionName, roleId: role.id },
    });
    if (existingPermission) {
      throw new ConflictException('Permission already assigned to this role');
    }

    await this.prisma.permission.create({
      data: {
        name: permissionName,
        roleId: role.id,
      },
    });
  }

  async assignRoleToUser(userId: number, roleName: string): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
    });
  }

  async getRolePermissions(roleName: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role.permissions.map((p) => p.name);
  }
}