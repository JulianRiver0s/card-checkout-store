# Implementation Plan: Catálogo de productos y stock

**Branch**: `001-product-catalog` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-product-catalog/spec.md`

## Summary

API de solo lectura para el catálogo: `GET /products` y `GET /products/:id`. El detalle incluye
los cargos fijos por compra (base y envío). Es la base del backend hexagonal (dominio puro, casos
de uso ROP con `neverthrow`, adaptadores DynamoDB y HTTP) sobre NestJS 11 en Lambda, con sembrado
idempotente y hardening HTTP (helmet, CORS, validación y Swagger en `/docs`). Las decisiones están
en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 sobre Node.js 24 (Lambda `nodejs24.x`).

**Primary Dependencies**:
- NestJS 11 (`@nestjs/common`, `core`, `platform-express`, `swagger`)
- `neverthrow` 8, `helmet` 8, `class-validator`, `class-transformer`
- `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` v3
- `@codegenie/serverless-express` 4.17

**Storage**: DynamoDB, tabla `products` (on-demand, PK `id`).

**Testing**: Jest 30 + ts-jest 29.4, `supertest`, `aws-sdk-client-mock`.

**Target Platform**: AWS Lambda detrás de API Gateway HTTP API. En local, `nest start` (Express).

**Project Type**: web-service (backend de una app web; el frontend llega en la 003).

**Performance Goals**: catálogo visible en < 2 s en 4G (SC-001). La API responde en < 300 ms en
caliente.

**Constraints**:
- Montos en centavos enteros.
- Sin datos sensibles en esta feature.
- Sin Docker.
- Cobertura ≥ 80 % (meta 90).

**Scale/Scope**: < 50 productos, tráfico de demostración.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Estado |
|---|---|---|
| I. Test-First | `tasks.md` pondrá los tests antes que la implementación. `coverageThreshold` 80 en `package.json`; solo se excluye `main.ts` | ✅ |
| II. Hexagonal + ROP | `domain/` sin Nest ni AWS. Puerto `ProductRepository` con adaptador Dynamo y fake en memoria. Casos de uso con `ResultAsync` y mapper único `toHttp` | ✅ |
| III. Seguridad | `ParseUUIDPipe`, `ValidationPipe` (whitelist + forbid), helmet, CORS por env, 500 genérico. Sin secretos en esta feature (la tabla va por env) | ✅ |
| IV. Marca | Nada en código ni docs menciona a la empresa | ✅ |
| V. Simplicidad + HTTP | Sin `@nestjs/config` ni ts-node; `Scan` para < 50 ítems; códigos 200/400/404/500 | ✅ |

**Re-check post-diseño**: ✅. El data model y el contrato no agregan dependencias ni
abstracciones. `AppError` crece en 002 sin romper nada.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-catalog/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── package.json            # scripts + jest config (coverageThreshold 80)
├── tsconfig.json / tsconfig.build.json / nest-cli.json
├── .env.example
├── src/
│   ├── domain/
│   │   ├── product.ts            # Product, availableUnits()
│   │   ├── fees.ts               # PurchaseFees
│   │   └── errors.ts             # AppError (unión discriminada) + constructores
│   ├── application/
│   │   ├── ports/product.repository.ts
│   │   └── use-cases/
│   │       ├── list-products.ts
│   │       └── get-product.ts
│   ├── infrastructure/
│   │   ├── config.ts             # loadConfig(env)
│   │   ├── http/
│   │   │   ├── products.controller.ts
│   │   │   ├── product.dto.ts    # DTOs de respuesta (Swagger)
│   │   │   └── to-http.ts        # Result → respuesta / HttpException
│   │   └── persistence/
│   │       └── dynamo-product.repository.ts
│   ├── app.module.ts             # wiring de puertos (tokens) y casos de uso
│   ├── app.factory.ts            # createApp(): helmet, CORS, pipes, swagger
│   ├── lambda.ts                 # handler serverless-express (cold start cacheado)
│   ├── main.ts                   # bootstrap local
│   └── seed.ts                   # SEED_PRODUCTS + seedProducts()
└── test/
    ├── fakes/in-memory-product.repository.ts
    └── products.e2e.spec.ts
```

Los tests unitarios van junto a cada archivo (`*.spec.ts`).

**Structure Decision**: web application (`backend/` ahora, `frontend/` en la 003). El backend
sigue las capas hexagonales de la constitución.

## Complexity Tracking

Sin violaciones que justificar.
