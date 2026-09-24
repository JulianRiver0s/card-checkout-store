# Data Model: Catálogo de productos y stock (001)

## Product (tabla DynamoDB `products`)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (UUID v4) | PK. Inmutable. |
| `name` | string | 1–120 caracteres. |
| `description` | string | 1–1000 caracteres. |
| `imageUrl` | string | Ruta relativa al CDN del frontend (`/images/products/<slug>.webp`). |
| `priceInCents` | number (entero) | > 0, entero seguro. COP × 100. |
| `stock` | number (entero) | ≥ 0. Esta feature solo lo lee; lo modifica el checkout (002). |

- **Regla de presentación**: `availableUnits = max(0, stock)`. Si un error de datos deja un stock
  negativo, el producto se muestra agotado (edge case del spec).
- **Identidad**: `id` es la clave única. El sembrado usa ids fijos para que sea idempotente.

## PurchaseFees (configuración, no persistida)

| Campo | Tipo | Default | Reglas |
|---|---|---|---|
| `baseFeeInCents` | number (entero) | 300000 (COP 3.000) | ≥ 0. Se cobra una vez por compra. |
| `deliveryFeeInCents` | number (entero) | 1000000 (COP 10.000) | ≥ 0. Se cobra una vez por compra. |

Origen: variables de entorno `BASE_FEE_IN_CENTS` y `DELIVERY_FEE_IN_CENTS`, validadas al arrancar.

## Errores de aplicación (`AppError`)

| `type` | HTTP | Cuándo |
|---|---|---|
| `NOT_FOUND` | 404 | El producto no existe. |
| `VALIDATION` | 400 | Entrada mal formada (id no UUID v4, campos desconocidos). |
| `UNEXPECTED` | 500 | Falla de infraestructura. Mensaje genérico hacia afuera. |

Estos tipos crecen en 002 (`CONFLICT` 409, `BUSINESS_RULE` 422, `PROVIDER` 502).
