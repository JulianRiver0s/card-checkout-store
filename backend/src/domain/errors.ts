export type AppError =
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'VALIDATION'; message: string }
  | { type: 'UNEXPECTED'; message: string; cause: unknown };

export const notFound = (message: string): AppError => ({ type: 'NOT_FOUND', message });

export const validation = (message: string): AppError => ({ type: 'VALIDATION', message });

// The cause is kept for logs only; clients always get the generic message.
export const unexpected = (cause: unknown): AppError => ({
  type: 'UNEXPECTED',
  message: 'Internal server error',
  cause,
});
