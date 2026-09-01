import { IsString, MinLength } from 'class-validator';

export class SwitchActiveWorkspaceDto {
  @IsString()
  @MinLength(1)
  workspaceId!: string;
}
