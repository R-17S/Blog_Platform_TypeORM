import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { LocalStrategy } from './guards/local/local.strategy';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailModule } from './email.module';
import { UserAccountsModule } from './user-accounts.module';
import { RegisterUserUseCase } from './application/usecases/users/register-user.usecase';
import { ConfirmRegistrationUseCase } from './application/usecases/users/confirm-registration.usecase';
import { ResendRegistrationUseCase } from './application/usecases/users/recend-registration.usecase';
import { NewPasswordUserUseCase } from './application/usecases/users/new-password.usecase';
import { PasswordRecoveryUseCase } from './application/usecases/users/password-recovery.usecase';
import { SendRecoveryEmailHandler } from './application/event-handlers/recovery-email-requested.handler';
import { SendRegistrationEmailHandler } from './application/event-handlers/registration-email-requested.handler';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constans/auth-tokens.inject-constants';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtRefreshStrategy } from './guards/bearer/jwtRefresh.strategy';
import { LogoutUserUseCase } from './application/usecases/logout-user.usecase';
import { RefreshTokensUseCase } from './application/usecases/refresh-token.usecase';
import { PassportModule } from '@nestjs/passport';
import { CoreConfig } from '../../core/core.config';
import { UserAccountsConfig } from './config/user-accounts.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/user.entity';
import { SecurityDeviceEntity } from './domain/securityDevices.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, SecurityDeviceEntity]),
    JwtModule,
    UserAccountsModule,
    EmailModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (
        coreConfig: CoreConfig,
        userAccountsConfig: UserAccountsConfig,
      ): JwtService => {
        return new JwtService({
          secret: coreConfig.accessTokenSecret, //TODO: move to env. will be in the following lessons
          signOptions: {
            expiresIn: userAccountsConfig.accessTokenExpireIn as any,
          },
        });
      },
      inject: [
        CoreConfig,
        UserAccountsConfig,
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (
        coreConfig: CoreConfig,
        userAccountsConfig: UserAccountsConfig,
      ): JwtService => {
        return new JwtService({
          secret: coreConfig.refreshTokenSecret, //TODO: move to env. will be in the following lessons
          signOptions: {
            expiresIn: userAccountsConfig.refreshTokenExpireIn as any,
          },
        });
      },
      inject: [
        CoreConfig,
        UserAccountsConfig,
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
    //
    AuthService,
    RegisterUserUseCase,
    ConfirmRegistrationUseCase,
    ResendRegistrationUseCase,
    PasswordRecoveryUseCase,
    NewPasswordUserUseCase,
    LoginUserUseCase,
    LogoutUserUseCase,
    RefreshTokensUseCase,
    //
    AuthQueryRepository,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    //
    SendRegistrationEmailHandler,
    SendRecoveryEmailHandler,
  ],
  exports: [AuthService, PassportModule, ACCESS_TOKEN_STRATEGY_INJECT_TOKEN],
})
export class AuthModule {}
