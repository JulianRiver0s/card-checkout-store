import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Result, ResultAsync } from 'neverthrow';
import { AppError } from '../../domain/errors';

const logger = new Logger('toHttp');

// Single place where domain errors become HTTP responses; controllers stay one-liners.
export async function toHttp<T>(result: ResultAsync<T, AppError> | Result<T, AppError>): Promise<T> {
  const settled = await result;
  if (settled.isOk()) return settled.value;
  throw toException(settled.error);
}

function toException(error: AppError): HttpException {
  switch (error.type) {
    case 'NOT_FOUND':
      return new NotFoundException(error.message);
    case 'VALIDATION':
      return new BadRequestException(error.message);
    case 'UNEXPECTED':
      logger.error(error.cause);
      return new InternalServerErrorException();
  }
}
