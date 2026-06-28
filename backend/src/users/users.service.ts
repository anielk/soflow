import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, CreatorProfile } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

interface UserData {
  email: string;
  passwordHash: string;
  username?: string;
}

interface UpdateProfileDto {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  username?: string;
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
    // Auto-generate username from email if not provided
    const username = userData.username || this.generateUsername(userData.email);
    
    return this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        username,
      },
    });
  }

  private generateUsername(email: string): string {
    const base = email.split('@')[0].toLowerCase();
    // Remove special characters and make it URL-friendly
    const clean = base.replace(/[^a-z0-9]/g, '').substring(0, 20);
    // Add random suffix to avoid duplicates
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${clean}${suffix}`;
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
    // Update user-level fields if provided
    const userUpdateFields: any = {};
    if (profileData.username !== undefined) userUpdateFields.username = profileData.username;
    if (profileData.bannerUrl !== undefined) userUpdateFields.bannerUrl = profileData.bannerUrl;

    if (Object.keys(userUpdateFields).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdateFields,
      });
    }

    // First check if the user has a creator profile
    let creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    const creatorUpdateFields: any = {};
    if (profileData.name !== undefined) creatorUpdateFields.name = profileData.name;
    if (profileData.bio !== undefined) creatorUpdateFields.bio = profileData.bio;
    if (profileData.avatarUrl !== undefined) creatorUpdateFields.avatarUrl = profileData.avatarUrl;
    if (profileData.website !== undefined) creatorUpdateFields.website = profileData.website;
    if (profileData.socialLinks !== undefined) creatorUpdateFields.socialLinks = profileData.socialLinks;

    if (Object.keys(creatorUpdateFields).length > 0) {
      if (!creatorProfile) {
        // Create new creator profile if it doesn't exist
        creatorProfile = await this.prisma.creatorProfile.create({
          data: {
            userId,
            ...creatorUpdateFields,
          },
        });
      } else {
        // Update existing creator profile
        creatorProfile = await this.prisma.creatorProfile.update({
          where: { userId },
          data: creatorUpdateFields,
        });
      }
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
