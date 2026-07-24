import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  // The frontend's register form has always collected this (labeled
  // "Username", placeholder "youragency") — this DTO previously omitted it,
  // so the global ValidationPipe's forbidNonWhitelisted rejected every real
  // registration attempt with a 400. Doubles as the new workspace's initial
  // display name (see AuthService.register) since this is a "create your
  // agency" flow, not a personal-account signup.
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username!: string;
}
