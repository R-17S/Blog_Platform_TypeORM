import { Test, TestingModuleBuilder } from '@nestjs/testing';
// пример: моки для сервисов
import { appSetup } from '../../src/setup/app.setup';
import { EmailService } from '../../src/modules/user-accounts/application/email.service';
import { EmailServiceMock } from '../mock/email-service.mock';

import { UsersTestManager } from './users-test-manager';
import { initAppModule } from '../../src/init-app-module';
import { PairGameManager } from './pair-game-manager';
import { QuestionsRepository } from '../../src/modules/quiz-game/infrastructure/questions.repository';

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const DynamicAppModule = await initAppModule();
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [DynamicAppModule],
  })

    // ✅ подмена EmailService на мок
    .overrideProvider(EmailService)
    .useClass(EmailServiceMock);

  // ✅ если нужно, можно добавить кастомные override
  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }
  const testingAppModule = await testingModuleBuilder.compile();
  const app = testingAppModule.createNestApplication();

  console.log('🔥 INIT: calling appSetup...');
  appSetup(app);

  console.log('🔥 INIT: calling app.init()...');
  await app.init();

  const questionsRepo = app.get(QuestionsRepository, { strict: false });


  return {
    app,
    httpServer: app.getHttpServer(),
    userTestManager: new UsersTestManager(app),
    pairGameManager: new PairGameManager(app, questionsRepo),
  };
};
