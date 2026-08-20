import { IsBoolean } from 'class-validator';

export class UpdateWorkspaceStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
