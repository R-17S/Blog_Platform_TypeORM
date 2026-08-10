import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

@Entity({ name: 'Users' })
@Index(['createdAt'])
@Index(['confirmationCode'])
@Index(['recoveryCode'])

// Так это должно решить проблему софтделит
@Index(['login'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['email'], { unique: true, where: '"deletedAt" IS NULL' })
export class UserEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'character varying', length: 10 })
  login: string;

  @Column({ type: 'character varying', length: 100 })
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

  static createForRegistration(input: {
    login: string;
    email: string;
    passwordHash: string;
  }): UserEntity {
    const user = new UserEntity();
    user.id = crypto.randomUUID();
    user.login = input.login;
    user.email = input.email;
    user.passwordHash = input.passwordHash;
    user.confirmationCode = randomUUID();
    user.confirmationExpiration = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
    user.isConfirmed = false;
    return user;
  }

  /**
   * 2. Создание пользователя администратором (сразу подтвержден)
   */
  static createByAdmin(input: {
    login: string;
    email: string;
    passwordHash: string;
  }): UserEntity {
    const user = new UserEntity();
    user.id = crypto.randomUUID();
    user.login = input.login;
    user.email = input.email;
    user.passwordHash = input.passwordHash;
    user.confirmationCode = null;
    user.confirmationExpiration = null;
    user.isConfirmed = true; // Сразу подтвержден!
    return user;
  }

  confirmEmail(): void {
    if (this.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email already confirmed',
        extensions: [{ key: 'email', message: 'Email already confirmed' }],
      });
    }

    if (
      this.confirmationExpiration &&
      this.confirmationExpiration < new Date()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired',
        extensions: [{ key: 'code', message: 'Confirmation code expired' }],
      });
    }

    this.confirmationCode = null;
    this.confirmationExpiration = null;
    this.isConfirmed = true;
  }

  updateConfirmationCode(newCode: string, expirationDate: Date): void {
    if (this.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email already confirmed',
        extensions: [{ key: 'email', message: 'Email already confirmed' }],
      });
    }

    this.confirmationCode = newCode;
    this.confirmationExpiration = expirationDate;
  }

  updatePassword(newPasswordHash: string): void {
    if (this.recoveryExpiration && this.recoveryExpiration < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Recovery code expired',
        extensions: [{ key: 'code', message: 'Recovery code expired' }],
      });
    }

    this.passwordHash = newPasswordHash;
    this.recoveryCode = null;
    this.recoveryExpiration = null;
  }

  setRecoveryCode(code: string, expirationDate: Date): void {
    this.recoveryCode = code;
    this.recoveryExpiration = expirationDate;
  }
}
