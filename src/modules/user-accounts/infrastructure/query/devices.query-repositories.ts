import { Injectable } from '@nestjs/common';
import { SecurityDeviceEntity } from '../../domain/securityDevices.entity';
import { DevicesViewModel } from '../../api/view-dto/securityDevices.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectRepository(SecurityDeviceEntity)
    private readonly securityDevicesQueryRepository: Repository<SecurityDeviceEntity>,
  ) {}

  async getAllDevices(userId: string): Promise<DevicesViewModel[]> {
    const device = await this.securityDevicesQueryRepository.find({
      where: { userId },
      order: {
        lastActiveDate: 'DESC',
      },
    });

    return device.map((device) => DevicesViewModel.mapToView(device));
  }
}
