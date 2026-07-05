import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DemoRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
