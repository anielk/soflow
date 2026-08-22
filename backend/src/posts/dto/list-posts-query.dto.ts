import { IsEnum, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class ListPostsQueryDto {
  /** Omit to see every status (drafts and scheduled together). */
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
