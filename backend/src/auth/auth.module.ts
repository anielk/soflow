import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { LoginThrottleGuard } from './login-throttle.guard';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    UsersModule,
    NotificationModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, LoginThrottleGuard],
  exports: [AuthService],
})
export class AuthModule {}