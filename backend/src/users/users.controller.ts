import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserSummaryDto } from './dto/user-summary.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Platform-wide user list — was previously unauthenticated and returned
  // raw Prisma rows (passwordHash, resetTokenHash included). Now requires a
  // valid JWT plus SUPER_ADMIN, and only ever returns UserSummaryDto.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get()
  async findAll(): Promise<UserSummaryDto[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    const user = await this.usersService.getProfile(req.user.userId);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() profileDto: any) {
    return this.usersService.updateProfile(req.user.userId, profileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(@Req() req: any, @Body() dto: { currentPassword: string; newPassword: string }) {
    await this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
    return { success: true, message: 'Password changed successfully' };
  }
}