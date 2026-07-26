import { UserCookiesDto } from '../../guards/dto/user-cookies.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UsersRepository } from '../../infrastructure/users.repository';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { SecurityDevicesRepository } from '../../infrastructure/devices.repositories';


export class RefreshTokensCommand {
  constructor(public readonly payload: UserCookiesDto) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase
  implements ICommandHandler<RefreshTokensCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly securityDevicesRepository: SecurityDevicesRepository,

    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenService: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenService: JwtService,
  ) {}

  async execute({ payload }: RefreshTokensCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // 1. Проверяем, что пользователь существует
    const user = await this.usersRepository.findById(payload.id);
    if (!user)
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User not found',
        extensions: [{ key: 'userId', message: 'User not found' }],
      });

    // 2. Проверяем устройство
    const device = await this.securityDevicesRepository.findByDeviceId(
      payload.deviceId,
    );
    if (!device || device.userId !== payload.id)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device not found',
        extensions: [{ key: 'payload.deviceId', message: 'Device not found' }],
      });

    // 3. Генерируем новые токены
    const accessToken = this.accessTokenService.sign({
      id: user.id,
      login: user.login,
    });

    const newRefreshToken = this.refreshTokenService.sign({
      id: user.id,
      deviceId: payload.deviceId,
    });

    // 4. Обновляем lastActiveDate устройства
    const newPayload = this.refreshTokenService.decode<{ iat: number }>(
      newRefreshToken,
    );

    const newLastActiveDate = new Date(newPayload.iat * 1000);

    device.lastActiveDate = newLastActiveDate;
    await this.securityDevicesRepository.save(device);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
