import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';



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
}