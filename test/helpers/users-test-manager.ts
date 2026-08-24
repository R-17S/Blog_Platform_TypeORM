import { HttpStatus, INestApplication } from '@nestjs/common';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/users.input-dto';
import {
  MeViewDto,
  UserViewModel,
} from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import * as request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { delay } from './delay';
import { CreateUserDto } from '../../src/modules/user-accounts/dto/create-user.dto';
import { DevicesViewModel } from '../../src/modules/user-accounts/api/view-dto/securityDevices.view-dto';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';

interface LoginResponseBody {
  accessToken: string;
}

export class UsersTestManager {
  constructor(
    private app: INestApplication,
    //private readonly usersRepository: UsersRepository,
  ) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<UserViewModel> {
    const response = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/sa/users`)
      .send(createModel)
      .auth('admin', 'qwerty');

    if (response.status === 500) console.log(response.text);
    return response.body as UserViewModel;
  }

  // async updateUser(
  //   userId: string,
  //   updateModel: UpdateUserInputDto,
  //   statusCode: number = HttpStatus.NO_CONTENT,
  // ): Promise<UserViewModel> {
  //   const response = await request(this.app.getHttpServer())
  //     .put(`/${GLOBAL_PREFIX}/users/${userId}`)
  //     .send(updateModel)
  //     .auth('admin', 'qwerty')
  //     .expect(statusCode);
  //
  //   return response.body;
  // }

  async login(
    loginOrEmail: string,
    password: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    console.log(
      '🔥 [TestManager] данные вообще приходят ',
      loginOrEmail,
      password,
    );
    const response = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({ loginOrEmail, password })
      .expect(statusCode);
    expect(response.status).toBe(statusCode);


    const { accessToken } = response.body as LoginResponseBody;
    const refreshToken = response.headers['set-cookie'][0]
      .split(';')[0]
      .replace('refreshToken=', '');
    console.log('🔥 [Login] set-cookie:', response.headers['set-cookie']);
    console.log('🔥 [Login] accessToken:', response.body);
    return { accessToken, refreshToken };
  }

  async me(
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<MeViewDto> {
    const response = await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/auth/me`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode);

    return response.body as MeViewDto;
  }

  async createSeveralUsers(count: number): Promise<UserViewModel[]> {
    //const usersPromises = [] as Promise<UserViewModel>[];
    const usersPromises: UserViewModel[] = [];

    for (let i = 0; i < count; ++i) {
      await delay(50);
      const response = await this.createUser({
        //TODO: какого хрена синхрон быстрее асинхрон?
        login: `test` + i,
        email: `test${i}@gmail.com`,
        password: '123456789',
      });
      usersPromises.push(response);
    }

    //return Promise.all(usersPromises);
    return usersPromises;
  }

  async createAndLoginSeveralUsers(
    count: number,
  ): Promise<{ accessToken: string; refreshToken: string }[]> {
    const users = await this.createSeveralUsers(count);
    console.log('🔥 [TestManager] users created:', users);

    const loginPromises = users.map((user: UserViewModel) =>
      this.login(user.login, '123456789'),
    );
    console.log('🔥 [TestManager] loginPromises created:', loginPromises);
    // loginPromises — это массив НЕ результатов, а промисов, которые ещё выполняются
    // хочешь увидеть результат промиса const tokens = await Promise.all(loginPromises);

    return await Promise.all(loginPromises);
  }

  async getRecoveryCode(email: string): Promise<string> {
    const usersRepository = this.app.get(UsersRepository);
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    const code = user.recoveryCode;
    if (!code) {
      throw new Error(`Recovery code for ${email} not found`);
    }
    return code;
  }

  async createAndLoginSingleUser(): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    await this.createUser(body);
    const { accessToken, refreshToken } = await this.login(
      body.login,
      body.password,
    );
    return { accessToken, refreshToken };
  }

  async getDevices(
    refreshToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<DevicesViewModel> {
    const response = await request(this.app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(statusCode);
    return response.body as DevicesViewModel;
  }

  async refreshToken(
    refreshToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<{ accessToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(statusCode);
    return response.body as { accessToken: string };
  }
}
