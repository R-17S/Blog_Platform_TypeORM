import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from './helpers/users-test-manager';
import { initSettings } from './helpers/init-settings';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../src/modules/user-accounts/dto/create-user.dto';
import * as request from 'supertest';
import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { PaginatedViewDto } from '../src/core/dto/base.paginated.view-dto';
import {
  MeViewDto,
  UserViewModel,
} from '../src/modules/user-accounts/api/view-dto/users.view-dto';
import { delay } from './helpers/delay';
import { EmailService } from '../src/modules/user-accounts/application/email.service';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { TestingService } from '../src/modules/testing/ application/testing.service';

describe('users', () => {
  let app: INestApplication;
  let userTestManager: UsersTestManager;
  let testingService: TestingService;


  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useValue(
          new JwtService({
            secret: process.env.ACCESS_TOKEN_SECRET || 'secretOrKey_forTest', //TODO: move to env. will be in the following lessons
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

  it('should create user', async () => {
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const response: UserViewModel = await userTestManager.createUser(body);

    expect(response).toEqual({
      id: expect.any(String),
      login: body.login,
      email: body.email,
      createdAt: expect.any(String),
    });
  });

  it('should get users with paging', async () => {
    const users = await userTestManager.createSeveralUsers(12);

    const { body: responseBody } = (await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/sa/users?pageNumber=2&sortDirection=asc`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK)) as { body: PaginatedViewDto<UserViewModel> };

    expect(responseBody.totalCount).toBe(12);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.pagesCount).toBe(2);
    //asc sorting
    expect(responseBody.items[1]).toEqual(users[users.length - 1]);
    //etc...
  });

  it('should return users info while "me" request with correct accessTokens', async () => {
    const tokens = await userTestManager.createAndLoginSeveralUsers(1);

    const responseBody = await userTestManager.me(tokens[0].accessToken);

    expect(responseBody).toEqual({
      login: expect.anything(),
      userId: expect.anything(),
      email: expect.anything(),
    } as MeViewDto);
  });

  it(`shouldn't return users info while "me" request if accessTokens expired`, async () => {
    const tokens = await userTestManager.createAndLoginSeveralUsers(1);
    await delay(2000);
    await userTestManager.me(tokens[0].accessToken, HttpStatus.UNAUTHORIZED);
  });

  // -----------------------------
  // РЕГИСТРАЦИЯ
  // -----------------------------
  it(`should register user without really send email`, async () => {
    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        email: 'email@email.em',
        password: '123123123',
        login: 'login123',
      } as CreateUserDto)
      .expect(HttpStatus.NO_CONTENT);
  });

  it(`should call email sending method while registration`, async () => {
    const sendEmailMethod = (app.get(EmailService).sendRegistrationEmail = jest
      .fn()
      .mockImplementation(() => Promise.resolve()));

    await request(app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        email: 'email@email.em',
        password: '123123123',
        login: 'login123',
      } as CreateUserDto)
      .expect(HttpStatus.NO_CONTENT);

    expect(sendEmailMethod).toHaveBeenCalled();
  });
});

// describe('users', () => {
//   it('dummy test', () => {
//     expect(true).toBe(true);
//   });
// });
