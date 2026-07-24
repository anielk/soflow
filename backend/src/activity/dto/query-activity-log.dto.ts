import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryActivityLogDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  /** Scope to one entity's history, e.g. a single Creator's activity feed. */
  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}
