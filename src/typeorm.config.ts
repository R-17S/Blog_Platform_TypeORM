import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
config({ path: path.resolve(__dirname, '..', envFile) });
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/*.ts'],
});
