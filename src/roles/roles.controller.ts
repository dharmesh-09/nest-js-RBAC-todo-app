import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './create-role.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../../generated/prisma';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(201)
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, permissions } = createRoleDto;
    return this.rolesService.createRole(name, permissions);
  }

  @Post('assign-permission')
  @HttpCode(200)
  async assignPermission(@Body() body: { roleName: string; permissionName: string }): Promise<void> {
    await this.rolesService.assignPermission(body.roleName, body.permissionName);
  }

  @Post('assign-user')
  @HttpCode(200)
  async assignRoleToUser(@Body() body: { userId: number; roleName: string }): Promise<void> {
    await this.rolesService.assignRoleToUser(body.userId, body.roleName);
  }
}