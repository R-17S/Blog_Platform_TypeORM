import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { SecurityDevicesRepository } from '../../infrastructure/devices.repositories';
import { UserEntity } from '../../domain/user.entity';
import { SecurityDeviceEntity } from '../../domain/securityDevices.entity';

export class LoginUserCommand {
  constructor(
    public readonly user: UserEntity,
    public readonly ip: string,
    public readonly title: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}

  async execute({ user, ip, title }: LoginUserCommand) {
    const deviceId = randomUUID();
    const userId = user.id;

    const refreshToken = this.refreshTokenContext.sign({
      id: userId,
      deviceId,
    });

    const payload = this.refreshTokenContext.decode<{ iat: number }>(
      refreshToken,
    );
    const lastActiveDate = new Date(payload.iat * 1000);

    const device = new SecurityDeviceEntity();
    device.id = randomUUID();
    device.userId = userId;
    device.deviceId = deviceId;
    device.ip = ip;
    device.title = title;
    device.lastActiveDate = lastActiveDate;

    await this.securityDevicesRepository.save(device);
    const accessToken = this.accessTokenContext.sign({
      id: userId,
      login: user.login,
    });

    return { accessToken, refreshToken };
  }
}
