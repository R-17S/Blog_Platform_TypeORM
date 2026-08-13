import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { TestingService } from '../ application/testing.service';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    await this.testingService.clearDatabase();
  }

  @Delete('quiz-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearQuizDatabase(): Promise<void> {
    await this.testingService.clearQuizDatabase();
  }
}
