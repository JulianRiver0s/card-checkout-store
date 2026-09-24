import { notFound, unexpected, validation } from './errors';

describe('AppError constructors', () => {
  it('builds a NOT_FOUND error with its message', () => {
    expect(notFound('Product x not found')).toEqual({
      type: 'NOT_FOUND',
      message: 'Product x not found',
    });
  });

  it('builds a VALIDATION error with its message', () => {
    expect(validation('bad id')).toEqual({ type: 'VALIDATION', message: 'bad id' });
  });

  it('builds an UNEXPECTED error that keeps the cause but exposes a generic message', () => {
    const cause = new Error('ResourceNotFoundException: table products');
    expect(unexpected(cause)).toEqual({
      type: 'UNEXPECTED',
      message: 'Internal server error',
      cause,
    });
  });
});
