import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreatorsService {
  constructor(private prisma: PrismaService) {}

  async getByUsername(username: string) {
    // This is a placeholder implementation
    // In a real application, this would query the database for creator by username
    const user = await this.prisma.user.findUnique({
      where: { email: username }, // Simplified - in reality you'd have a unique username field
      include: {
        creatorProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      creatorProfile: user.creatorProfile,
    };
  }
}