import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, CreatorProfile } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

interface UserData {
  email: string;
  passwordHash: string;
}

interface UpdateProfileDto {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  socialLinks?: Record<string, string>;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(userData: UserData): Promise<User> {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      creatorProfile: user.creatorProfile || null,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return true;
  }

  async updateProfile(userId: string, profileData: UpdateProfileDto): Promise<any> {
    // First check if the user has a creator profile
    let creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      // Create new creator profile if it doesn't exist
      creatorProfile = await this.prisma.creatorProfile.create({
        data: {
          userId,
          ...profileData,
        },
      });
    } else {
      // Update existing creator profile
      creatorProfile = await this.prisma.creatorProfile.update({
        where: { userId },
        data: profileData,
      });
    }

    // Return updated user with profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
      },
    });

    return {
      ...user,
      creatorProfile,
    };
  }
}
