import { Controller, Post, Body, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from '../../generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string, roleName: string }) {
    return this.authService.register(body.email, body.password, body.roleName);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    await this.authService.logout(body.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  // @UseGuards(AuthGuard('jwt'))
  async logoutAll(@GetUser() user: User) {
    await this.authService.logoutAll(user.id);
    return { message: 'Logged out from all devices successfully' };
  }
}