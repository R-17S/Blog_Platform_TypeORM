import { Injectable } from '@nestjs/common';
import { SecurityDeviceEntity } from '../domain/securityDevices.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

@Injectable()
export class SecurityDevicesRepository {
  constructor(
    @InjectRepository(SecurityDeviceEntity)
    private securityDevicesTypeOrmRepository: Repository<SecurityDeviceEntity>,
  ) {}

  async save(device: SecurityDeviceEntity): Promise<void> {
    await this.securityDevicesTypeOrmRepository.save(device);
  }

  async findAllByUserId(userId: string): Promise<string[]> {
    const device = await this.securityDevicesTypeOrmRepository.find({
      select: {
        deviceId: true,
      },
      where: { userId },
    });
    return device.map((d) => d.deviceId);
  }

  async findAllDeviceIdsExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ): Promise<string[]> {
    const device = await this.securityDevicesTypeOrmRepository.find({
      select: {
        deviceId: true,
      },
      where: {
        userId,
        deviceId: Not(currentDeviceId),
      },
    });
    return device.map((d) => d.deviceId);
  }

  async deleteManyByDeviceIds(deviceIds: string[]): Promise<void> {
    await this.securityDevicesTypeOrmRepository.delete({
      deviceId: In(deviceIds),
    });
  }

  async findByDeviceId(deviceId: string): Promise<SecurityDeviceEntity | null> {
    return await this.securityDevicesTypeOrmRepository.findOne({
      where: { deviceId },
    });
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.securityDevicesTypeOrmRepository.delete({ deviceId });
  }

  async updateLastActive(deviceId: string, date: Date): Promise<void> {
    await this.securityDevicesTypeOrmRepository.update(
      { deviceId },
      { lastActiveDate: date },
    );
  }
}
