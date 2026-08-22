import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType = PostType.FREE;

  /** Informational only — no payment processing exists behind this yet. Only meaningful when type is PPV. */
  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;

  /** Omit to save as a draft; set to queue it as scheduled. */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  /** Media already uploaded via POST /media/upload, being attached to this post. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  mediaIds?: string[];
}
