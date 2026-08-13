import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
  constructor(private readonly dataSource: DataSource) {}

  async clearDatabase(): Promise<void> {
    // CASCADE автоматически разруливает все внешние ключи.
    await this.dataSource.query(`
      TRUNCATE TABLE 
        "CommentLikes", 
        "PostLikes", 
        "Comments", 
        "Posts", 
        "SecurityDevices", 
        "Users", 
        "Blogs" 
      RESTART IDENTITY CASCADE;
    `);
  }

  async clearQuizDatabase(): Promise<void> {
    await this.dataSource.query(`
    TRUNCATE TABLE
      "QuizQuestion"
    RESTART IDENTITY CASCADE;
    `);
  }
}
