import { NestFactory } from '@nestjs/core';
import { appSetup } from './setup/app.setup';
import { config } from 'dotenv';
import { CoreConfig } from './core/core.config';
import { initAppModule } from './init-app-module';

const result = config();
async function bootstrap() {
  const DynamicAppModule = await initAppModule();
  // создаём на основе донастроенного модуля наше приложение
  const app = await NestFactory.create(DynamicAppModule);
  const coreConfig = app.get(CoreConfig);
  appSetup(app);
  await app.listen(coreConfig.port);
  console.log('✅ Оно работает, можно пока прочитать молитву духу машины');
}
bootstrap();
