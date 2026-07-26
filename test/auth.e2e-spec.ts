import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';
import { CreateUserDto } from '../src/modules/user-accounts/dto/create-user.dto';
import * as request from 'supertest';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { UserViewModel } from '../src/modules/user-accounts/api/view-dto/users.view-dto';
import { EmailService } from '../src/modules/user-accounts/application/email.service';
import { delay } from './helpers/delay';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { TestingService } from '../src/modules/testing/ application/testing.service';

describe('auth', () => {
  let app: INestApplication;
  let userTestManager: UsersTestManager;
  let testingService: TestingService;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
        .useValue(
          new JwtService({
            secret: process.env.REFRESH_TOKEN_SECRET || 'secretOrKey_forTest',
            signOptions: { expiresIn: '2s' },
          }),
        );

      moduleBuilder.overrideProvider(EmailService).useValue({
        sendRegistrationEmail: jest.fn().mockResolvedValue(true),
        sendRecoveryEmail: jest.fn().mockResolvedValue(true),
        sendPasswordUpdatedEmail: jest.fn().mockResolvedValue(true),
      });
    });

    app = result.app;
    userTestManager = result.userTestManager;
    testingService = app.get(TestingService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await testingService.clearDatabase();
  });

  // -----------------------------
  // ВОССТАНОВЛЕНИЕ ПАРОЛЯ
  // -----------------------------
  it('should trigger password recovery email', async () => {
    const user = await userTestManager.createUser({
      login: 'user1',
      password: '12345678',
      email: 'user1@email.com',
    });

    const sendRecoveryEmail = (app.get(EmailService).sendRecoveryEmail = jest
      .fn()
      .mockResolvedValue(true));

    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
      .send({ email: user.email })
      .expect(HttpStatus.NO_CONTENT);
    expect(sendRecoveryEmail).toHaveBeenCalled();
  });

  // -----------------------------
  // NEW PASSWORD
  // -----------------------------
  it('should update password using recoveryCode', async () => {
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const user: UserViewModel = await userTestManager.createUser(body);
    const sendRecoveryEmail = (app.get(EmailService).sendRecoveryEmail = jest
      .fn()
      .mockResolvedValue(true));

    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
      .send({ email: user.email })
      .expect(HttpStatus.NO_CONTENT);

    const recoveryCode = await userTestManager.getRecoveryCode(user.email);
    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/new-password`)
      .send({ newPassword: 'newPassword123', recoveryCode })
      .expect(HttpStatus.NO_CONTENT);
  });

  // -----------------------------
  // REFRESH TOKEN
  // -----------------------------
  it('should refresh tokens and update lastActiveDate', async () => {
    const tokens = await userTestManager.createAndLoginSingleUser();
    const response = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', `refreshToken=${tokens.refreshToken}`)
      .expect(HttpStatus.OK);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });

  it('should refresh tokens and update lastActiveDate----2----', async () => {
    const tokens = await userTestManager.createAndLoginSeveralUsers(1);
    const response = await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', `refreshToken=${tokens[0].refreshToken}`)
      .expect(HttpStatus.OK);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });

  // -----------------------------
  // LOGOUT
  // -----------------------------
  it('should logout and delete current device session', async () => {
    const { accessToken, refreshToken } = await userTestManager.createAndLoginSingleUser();
    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/logout`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HttpStatus.NO_CONTENT);
    await userTestManager.getDevices(refreshToken, HttpStatus.UNAUTHORIZED);
  });

  it('Тест инкубатора для рефрешТокена', async () => {
    const { accessToken, refreshToken } =
      await userTestManager.createAndLoginSingleUser();

    await delay(2000);

    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/logout`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });
});

// describe('auth', () => {
//   it('dummy test', () => {
//     expect(true).toBe(true);
//   });
// });
