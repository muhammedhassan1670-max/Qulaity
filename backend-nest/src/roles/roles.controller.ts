import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions('roles.manage')
  list() {
    return this.roles.list();
  }

  @Get(':id')
  @Permissions('roles.manage')
  getById(@Param('id') id: string) {
    return this.roles.getById(id);
  }

  @Post()
  @Permissions('roles.manage')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @Permissions('roles.manage')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @Permissions('roles.manage')
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }

  @Get(':id/permissions')
  @Permissions('roles.manage')
  getPermissions(@Param('id') id: string) {
    return this.roles.getPermissions(id);
  }

  @Put(':id/permissions')
  @Permissions('roles.manage')
  setPermissions(@Param('id') id: string, @Body() dto: SetRolePermissionsDto) {
    return this.roles.setPermissions(id, dto);
  }
}
