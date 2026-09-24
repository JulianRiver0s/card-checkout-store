import { PurchaseFees } from '../domain/fees';

export interface AppConfig {
  port: number;
  productsTable: string;
  corsOrigins: string[];
  fees: PurchaseFees;
}

export const APP_CONFIG = Symbol('AppConfig');

// ponytail: plain env parsing; swap for @nestjs/config if config grows beyond a handful of vars
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 3000),
    productsTable: env.PRODUCTS_TABLE ?? 'products',
    corsOrigins: (env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    fees: {
      baseFeeInCents: cents('BASE_FEE_IN_CENTS', env.BASE_FEE_IN_CENTS, 300000),
      deliveryFeeInCents: cents('DELIVERY_FEE_IN_CENTS', env.DELIVERY_FEE_IN_CENTS, 1000000),
    },
  };
}

function cents(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer amount in cents, got "${raw}"`);
  }
  return value;
}
