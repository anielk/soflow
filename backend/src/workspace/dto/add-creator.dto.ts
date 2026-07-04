import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddCreatorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
