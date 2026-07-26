import { ArgonService } from './argon2.service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { SecurityDevicesRepository } from '../infrastructure/devices.repositories';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private argonService: ArgonService,
    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}

  // -----------------------------
  // 1. LOGIN
  // -----------------------------
  async validateUser(
    username: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const isEmail = username.includes('@');

    const user = isEmail
      ? await this.usersRepository.findByEmail(username)
      : await this.usersRepository.findByLogin(username);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.argonService.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async checkRefreshToken(deviceId: string, iat: number): Promise<void> {
    const device =
      await this.securityDevicesRepository.findByDeviceId(deviceId);
    if (!device)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device not found',
        extensions: [{ key: 'payload.deviceId', message: 'Device not found' }],
      });

    const tokenIssuedAt = new Date(iat * 1000).getTime();
    const deviceLastActive = new Date(device.lastActiveDate).getTime();
    console.log("🔥 tokenIssuedAt:   ", tokenIssuedAt);
    console.log("🔥 deviceLastActive:", deviceLastActive);
    if (tokenIssuedAt !== deviceLastActive)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device not found',
        extensions: [{ key: 'payload.iat', message: 'Token is outdated' }],
      });
  }
}
