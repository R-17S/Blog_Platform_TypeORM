import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { PasswordRecoveryDto } from './input-dto/passwordRecovery.input-dto';
import { NewPasswordDto } from './input-dto/newPassword.input-dto';
import { RegistrationConfirmationDto } from './input-dto/registrationConfirmation.input-dto';
import { EmailResendingDto } from './input-dto/emailResending.input-dto';
import type { Request, Response } from 'express';
import { PasswordRecoveryCommand } from '../application/usecases/users/password-recovery.usecase';
import { NewPasswordCommand } from '../application/usecases/users/new-password.usecase';
import { ConfirmRegistrationCommand } from '../application/usecases/users/confirm-registration.usecase';
import { RegisterUserCommand } from '../application/usecases/users/register-user.usecase';
import { ResendRegistrationCommand } from '../application/usecases/users/recend-registration.usecase';
import { CommandBus } from '@nestjs/cqrs';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwtRefresh-auth.guard';
import { RefreshTokensCommand } from '../application/usecases/refresh-token.usecase';
import { UserCookiesDto } from '../guards/dto/user-cookies.dto';
import { LogoutUserCommand } from '../application/usecases/logout-user.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { MeViewDto } from './view-dto/users.view-dto';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { UserEntity } from '../domain/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @Req() req: Request,
    @ExtractUserFromRequest() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    //console.log('🔥 [Controller] login called with:', user.id);
    const ip = req.ip ?? 'unknown';
    const title = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken } = await this.commandBus.execute<
      any,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(user, ip, title));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // обязательно в проде
      sameSite: 'none',
    });
    return { accessToken };
  }

  @SkipThrottle()
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authQueryRepository.me(user.id);
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  passwordRecovery(@Body() dto: PasswordRecoveryDto): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(dto.email));
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  newPassword(@Body() dto: NewPasswordDto): Promise<void> {
    return this.commandBus.execute(
      new NewPasswordCommand(dto.newPassword, dto.recoveryCode),
    );
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmRegistration(@Body() dto: RegistrationConfirmationDto): Promise<void> {
    return this.commandBus.execute(new ConfirmRegistrationCommand(dto.code));
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    console.log('🔥 [Controller] registration called with:', body);
    return this.commandBus.execute(new RegisterUserCommand(body));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  resendEmail(@Body() dto: EmailResendingDto): Promise<void> {
    return this.commandBus.execute(new ResendRegistrationCommand(dto.email));
  }

  @SkipThrottle()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  async refreshTokens(
    @Req() req: Request,
    @ExtractUserFromRequest() user: UserCookiesDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    // console.log('req.headers.cookie:', req.headers.cookie);
    // console.log('🔥 [Refresh] cookies:', req.cookies);
    // console.log('🔥 [Refresh] user from token:', user);
    const { accessToken, refreshToken } = await this.commandBus.execute<
      any,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokensCommand(user));
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh-token',
    });
    return { accessToken };
  }

  @SkipThrottle()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshAuthGuard)
  async logout(
    @ExtractUserFromRequest() user: UserCookiesDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(new LogoutUserCommand(user));
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh-token',
    });
  }
}
