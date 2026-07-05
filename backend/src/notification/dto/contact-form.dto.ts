import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
