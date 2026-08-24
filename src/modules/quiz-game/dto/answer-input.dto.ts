import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../core/decorators/transform/trim';

export class AnswerInputDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  answer: string;
}
