import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginThrottleGuard } from './login-throttle.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // LoginThrottleGuard runs first, before LocalAuthGuard does any bcrypt
  // work — see login-throttle.guard.ts for the requests/window and bucket
  // key this dedicated brute-force limit uses.
  @UseGuards(LoginThrottleGuard, LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(req.user, req.ip, req.headers?.['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId, req.user.email, req.ip, req.headers?.['user-agent']);
    return { success: true };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: any): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto, req.ip, req.headers?.['user-agent']);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { success: true, message: 'If an account exists for that email, a reset link has been sent.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { success: true, message: 'Password reset successfully.' };
  }
}
