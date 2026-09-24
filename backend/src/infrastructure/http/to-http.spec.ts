import { HttpException, Logger } from '@nestjs/common';
import { errAsync, okAsync } from 'neverthrow';
import { notFound, unexpected, validation } from '../../domain/errors';
import { toHttp } from './to-http';

const statusOf = async (promise: Promise<unknown>) => {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(HttpException);
  return error as HttpException;
};

describe('toHttp', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('unwraps an Ok result', async () => {
    await expect(toHttp(okAsync({ id: 1 }))).resolves.toEqual({ id: 1 });
  });

  it('maps NOT_FOUND to 404 with the domain message', async () => {
    const error = await statusOf(toHttp(errAsync(notFound('Product x not found'))));
    expect(error.getStatus()).toBe(404);
    expect(error.message).toBe('Product x not found');
  });

  it('maps VALIDATION to 400', async () => {
    const error = await statusOf(toHttp(errAsync(validation('bad input'))));
    expect(error.getStatus()).toBe(400);
  });

  it('maps UNEXPECTED to a generic 500 and logs the cause instead of leaking it', async () => {
    const cause = new Error('ResourceNotFoundException: table products');
    const error = await statusOf(toHttp(errAsync(unexpected(cause))));
    expect(error.getStatus()).toBe(500);
    expect(JSON.stringify(error.getResponse())).not.toContain('products');
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});
