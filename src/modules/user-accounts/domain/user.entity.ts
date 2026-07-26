import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

@Entity({ name: 'Users' })
export class UserEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'character varying', length: 10, unique: true })
  login: string;

  @Column({ type: 'character varying', length: 100, unique: true })
  email: string;

  @Column({ type: 'character varying' })
  passwordHash: string;

  @Column({ type: 'character varying', nullable: true })
  confirmationCode: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  confirmationExpiration: Date | null;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'character varying', nullable: true })
  recoveryCode: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  recoveryExpiration: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
