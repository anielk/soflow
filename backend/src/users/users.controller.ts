import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
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