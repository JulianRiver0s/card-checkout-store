# Quickstart: Catálogo de productos y stock (001)

## Prerrequisitos

- Node 24 + npm 11.
- Para correr contra AWS: credenciales configuradas (`aws configure`) y la tabla `products` creada
  por el stack de SAM (feature 004). Solo para los tests no hace falta nada de AWS.

## Tests (no requieren AWS)

```bash
cd backend
npm ci
npm test -- --coverage
```

Esperado: todas las suites en verde y cobertura global ≥ 80 %. La corrida falla si baja del
umbral.

## Escenarios de validación

| Spec | Cómo se verifica | Esperado |
|---|---|---|
| US1-1 | e2e `GET /products` con el repositorio fake sembrado | 200 y un array con los campos de [Product](contracts/openapi.yaml) |
| US1-2 | producto con `stock: 0` | aparece con `availableUnits: 0` |
| US1-3 | repositorio vacío | 200 `[]` |
| US2-1 | `GET /products/{id}` existente | 200 con `fees.baseFeeInCents=300000` y `fees.deliveryFeeInCents=1000000` |
| US2-2 | UUID v4 inexistente | 404 |
| US2-3 | `GET /products/abc` | 400 |
| US3-1/2 | `seedProducts` ejecutado dos veces contra DynamoDB mockeado | mismos `PutItem` con los mismos ids |
| US3-3 | `POST /products` | 404 (la ruta no existe) |
| FR-009 | el repositorio falla | 500 `"Internal server error"`, sin detalles |
| FR-011 | respuesta de cualquier endpoint | headers de helmet presentes; CORS solo para `CORS_ORIGIN` |

## Correr local contra AWS (opcional)

```bash
cp .env.example .env        # PRODUCTS_TABLE, AWS_REGION, CORS_ORIGIN
npm run build && npm run seed
npm run start               # http://localhost:3000/products · http://localhost:3000/docs
```
