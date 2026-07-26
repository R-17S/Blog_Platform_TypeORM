import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { ArgonService } from './application/argon2.service';
import { CreateUserUseCase } from './application/usecases/admins/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/admins/delete-user.usecase';
import { CqrsModule } from '@nestjs/cqrs';
import { SecurityDevicesRepository } from './infrastructure/devices.repositories';
import { SecurityDevicesQueryRepository } from './infrastructure/query/devices.query-repositories';
import { SecurityDevicesController } from './api/security-devices.controller';
import { DeleteDeviceByIdUseCase } from './application/usecases/security-devices/delete-device-by-id.usecase';
import { DeleteAllDevicesExceptCurrentUseCase } from './application/usecases/security-devices/delete-all-devices-except-current.usecase';
import { UserAccountsConfig } from './config/user-accounts.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/user.entity';
import { SecurityDeviceEntity } from './domain/securityDevices.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, SecurityDeviceEntity]),
  ],
  controllers: [UsersController, SecurityDevicesController],
  providers: [
    //
    UsersRepository,
    UsersQueryRepository,
    CreateUserUseCase,
    DeleteUserUseCase,
    //
    SecurityDevicesRepository,
    SecurityDevicesQueryRepository,
    DeleteDeviceByIdUseCase,
    DeleteAllDevicesExceptCurrentUseCase,
    //
    ArgonService,
    //
    UserAccountsConfig,
  ],
  exports: [
    UsersRepository,
    SecurityDevicesRepository,
    ArgonService,
    UserAccountsConfig,
  ],
})
export class UserAccountsModule {}
