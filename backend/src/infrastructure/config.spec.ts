import { loadConfig } from './config';

describe('loadConfig', () => {
  it('applies defaults when variables are missing', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      productsTable: 'products',
      corsOrigins: [],
      fees: { baseFeeInCents: 300000, deliveryFeeInCents: 1000000 },
    });
  });

  it('reads explicit values and splits CORS origins', () => {
    const config = loadConfig({
      PORT: '8080',
      PRODUCTS_TABLE: 'store-products',
      CORS_ORIGIN: 'https://a.example, https://b.example ,',
      BASE_FEE_IN_CENTS: '0',
      DELIVERY_FEE_IN_CENTS: '550000',
    });

    expect(config).toEqual({
      port: 8080,
      productsTable: 'store-products',
      corsOrigins: ['https://a.example', 'https://b.example'],
      fees: { baseFeeInCents: 0, deliveryFeeInCents: 550000 },
    });
  });

  it.each(['-1', '10.5', 'abc'])('rejects a fee that is not a non-negative integer (%s)', (raw) => {
    expect(() => loadConfig({ BASE_FEE_IN_CENTS: raw })).toThrow(/BASE_FEE_IN_CENTS/);
  });
});
