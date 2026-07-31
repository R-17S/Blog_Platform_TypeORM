import { UserCookiesDto } from '../../guards/dto/user-cookies.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SecurityDevicesRepository } from '../../infrastructure/devices.repositories';

export class LogoutUserCommand {
  constructor(public readonly payload: UserCookiesDto) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}
  async execute({ payload }: LogoutUserCommand): Promise<void> {
    const { id: userId, deviceId } = payload;

    // 1. Ищем устройство
    const device =
      await this.securityDevicesRepository.findByDeviceId(deviceId);
    if (!device)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device not found',
        extensions: [{ key: 'payload.deviceId', message: 'Device not found' }],
      });

    // 2. Проверяем принадлежность устройства пользователю
    device.checkOwnershipOrError(userId);

    // 3. Удаляем устройство (logout)
    await this.securityDevicesRepository.deleteDevice(deviceId);
  }
}
