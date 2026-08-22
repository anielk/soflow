import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PostType } from '@prisma/client';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;

  /** Set to schedule/reschedule; pass null to move it back to a draft with no schedule. */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  mediaIds?: string[];
}
