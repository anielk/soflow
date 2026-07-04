import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;
}
