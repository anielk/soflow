import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCreatorProfileDto, toPublicCreatorProfile } from './dto/public-creator-profile.dto';

@Injectable()
export class CreatorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * The unauthenticated public profile page. Looks up the real, unique
   * `username` field — this used to match by `email` as a stand-in because
   * no username field existed yet; one does now (see User.username).
   *
   * Also requires `isCreator: true`: this is a self-service opt-in feature
   * (see UsersService.updateProfile / the creator/edit page) — every
   * registered account has a username, but only a user who has actually
   * turned on their creator profile should be reachable at this public URL.
   * Without this check, switching from the email hack to a real username
   * lookup would have made this endpoint an accidental full user directory.
   */
  async getByUsername(username: string): Promise<PublicCreatorProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { creatorProfile: true },
    });

    if (!user || !user.isCreator) {
      throw new NotFoundException('Creator not found');
    }

    return toPublicCreatorProfile(user);
  }
}
