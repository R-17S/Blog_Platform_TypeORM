import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { randomUUID } from 'node:crypto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';



@Entity({ name: 'SecurityDevices' })
export class SecurityDeviceEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'character varying' })
  deviceId: string;

  @Column({ type: 'character varying' })
  ip: string;

  @Column({ type: 'character varying' })
  title: string;

  @Column({ type: 'timestamp with time zone' })
  lastActiveDate: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  static create(input: {
    userId: string;
    deviceId: string;
    ip: string;
    title: string;
    lastActiveDate: Date;
  }): SecurityDeviceEntity {
    const device = new SecurityDeviceEntity();
    device.id = randomUUID();
    device.userId = input.userId;
    device.deviceId = input.deviceId;
    device.ip = input.ip;
    device.title = input.title;
    device.lastActiveDate = input.lastActiveDate;
    return device;
  }

  checkOwnershipOrError(userId: string): void {
    if (this.userId !== userId)
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device does not belong to this user',
        extensions: [
          {
            key: 'payload.deviceId',
            message: 'Device does not belong to this user',
          },
        ],
      });
  }

  updateLastActiveDate(newActiveDate: Date): void {
    this.lastActiveDate = newActiveDate;
  }

  checkTokenActiveOrError(iat: number): void {
    const tokenIssuedAt = new Date(iat * 1000).getTime();
    const deviceLastActive = new Date(this.lastActiveDate).getTime();

    if (tokenIssuedAt !== deviceLastActive) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device not found',
        extensions: [{ key: 'payload.iat', message: 'Token is outdated' }],
      });
    }
  }
}
