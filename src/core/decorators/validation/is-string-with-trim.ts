import { applyDecorators } from '@nestjs/common';
import { IsString, Length, ValidationOptions } from 'class-validator';
import { Trim } from '../transform/trim';

export const IsStringWithTrim = (
  minLength: number,
  maxLength: number,
  validationOptions?: ValidationOptions,
) =>
  applyDecorators(
    IsString(),
    Length(minLength, maxLength, validationOptions),
    Trim(),
  );
