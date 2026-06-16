import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile() {
    // This will be implemented with proper authentication
    return { message: 'Profile endpoint' };
  }

  @Put('profile')
  async updateProfile(@Body() profileDto: any) {
    // This will be implemented with proper authentication
    return { message: 'Profile updated', data: profileDto };
  }
}