import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { IsStringWithTrim } from '../../../core/decorators/validation/is-string-with-trim';

export class CreateQuestionInputModel {
  @IsStringWithTrim(10, 500, {
    message: 'Body length should be between 10 and 500 characters',
  })
  @IsNotEmpty()
  body: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one correct answer must be provided' })
  @IsString({ each: true })
  correctAnswers: string[];
}
