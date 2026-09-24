---
description: "Task list for 001-product-catalog"
---

# Tasks: Catálogo de productos y stock

**Input**: Design documents from `/specs/001-product-catalog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: OBLIGATORIOS (Constitución I, Test-First). En cada fase los tests se escriben primero y
DEBEN fallar (red) antes de la implementación (green).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

- [X] T001 Crear `backend/` con package.json (NestJS 11, TS ~5.9, Jest 30, ts-jest, supertest, aws-sdk-client-mock, neverthrow, helmet, class-validator, class-transformer, @aws-sdk/lib-dynamodb, @codegenie/serverless-express 4.17), `tsconfig.json`, `tsconfig.build.json` y `nest-cli.json`
- [X] T002 Configurar Jest en `backend/package.json` (ts-jest, `rootDir` ., roots `src` + `test`, `collectCoverageFrom` `src/**/*.ts` excluyendo `main.ts`, `coverageThreshold` global 80) y verificar que `npm test` corre en verde con 0 tests
- [X] T003 [P] Crear `backend/.env.example` (AWS_REGION, PRODUCTS_TABLE, CORS_ORIGIN, BASE_FEE_IN_CENTS, DELIVERY_FEE_IN_CENTS, PORT)

---

## Phase 2: Foundational (bloquea todas las historias)

### Tests primero

- [X] T004 [P] Test de `AppError` y sus constructores en `backend/src/domain/errors.spec.ts`
- [X] T005 [P] Test de `toHttp` (Ok → valor; NOT_FOUND → 404; VALIDATION → 400; UNEXPECTED → 500 con mensaje genérico, sin filtrar la causa) en `backend/src/infrastructure/http/to-http.spec.ts`
- [X] T006 [P] Test de `loadConfig` (defaults 300000/1000000, parseo de CORS_ORIGIN en lista, error si un fee no es entero ≥ 0) en `backend/src/infrastructure/config.spec.ts`
- [X] T007 [P] Test de dominio `availableUnits` (stock positivo, 0, negativo → 0) en `backend/src/domain/product.spec.ts`

### Implementación

- [X] T008 [P] Implementar `backend/src/domain/errors.ts`
- [X] T009 [P] Implementar `backend/src/infrastructure/http/to-http.ts`
- [X] T010 [P] Implementar `backend/src/infrastructure/config.ts`
- [X] T011 [P] Implementar `backend/src/domain/product.ts` y `backend/src/domain/fees.ts`
- [X] T012 Definir el puerto `ProductRepository` en `backend/src/application/ports/product.repository.ts` y el fake en `backend/test/fakes/in-memory-product.repository.ts`

**Checkpoint**: la base está lista y las historias pueden empezar.

---

## Phase 3: User Story 1 - Ver el catálogo con stock (P1) 🎯 MVP

**Goal**: `GET /products` devuelve el catálogo con `availableUnits`.

**Independent Test**: e2e con el fake sembrado; escenarios US1-1..3 de [quickstart.md](quickstart.md).

### Tests primero

- [ ] T013 [P] [US1] Test del caso de uso `ListProducts` (lista mapeada, vacía, error del repo → UNEXPECTED) en `backend/src/application/use-cases/list-products.spec.ts`
- [ ] T014 [P] [US1] Test del adaptador `DynamoProductRepository.findAll` con `aws-sdk-client-mock` (Scan → productos; fallo del SDK → Err) en `backend/src/infrastructure/persistence/dynamo-product.repository.spec.ts`
- [ ] T015 [P] [US1] Test e2e `GET /products` (200 con campos del contrato, agotado con 0, vacío `[]`, 500 genérico si el repo falla, headers de helmet, CORS solo para el origen configurado, `GET /docs` → 200 por FR-010) en `backend/test/products.e2e.spec.ts`

### Implementación

- [ ] T016 [US1] Implementar `ListProducts` en `backend/src/application/use-cases/list-products.ts`
- [ ] T017 [US1] Implementar `findAll` en `backend/src/infrastructure/persistence/dynamo-product.repository.ts`
- [ ] T018 [US1] Implementar `ProductsController.list` + DTO en `backend/src/infrastructure/http/`, wiring en `backend/src/app.module.ts` y `createApp()` (helmet, CORS, ValidationPipe, Swagger `/docs`) en `backend/src/app.factory.ts`

**Checkpoint**: US1 funciona por sí sola.

---

## Phase 4: User Story 2 - Detalle con cargos de compra (P1)

**Goal**: `GET /products/:id` devuelve el producto con `fees`; 404 si no existe; 400 si el id es inválido.

**Independent Test**: escenarios US2-1..3 de [quickstart.md](quickstart.md).

### Tests primero

- [ ] T019 [P] [US2] Test del caso de uso `GetProduct` (encontrado + fees, no encontrado → NOT_FOUND, error del repo → UNEXPECTED) en `backend/src/application/use-cases/get-product.spec.ts`
- [ ] T020 [P] [US2] Test de `DynamoProductRepository.findById` (GetItem con Item, sin Item → null, fallo → Err) en `backend/src/infrastructure/persistence/dynamo-product.repository.spec.ts`
- [ ] T021 [P] [US2] Tests e2e `GET /products/:id` (200 con fees, 404, 400 con `abc`, 400 con UUID no v4) en `backend/test/products.e2e.spec.ts`

### Implementación

- [ ] T022 [US2] Implementar `GetProduct` en `backend/src/application/use-cases/get-product.ts`
- [ ] T023 [US2] Implementar `findById` en `backend/src/infrastructure/persistence/dynamo-product.repository.ts`
- [ ] T024 [US2] Implementar `ProductsController.getById` con `ParseUUIDPipe({ version: '4' })` y el DTO de detalle

**Checkpoint**: US1 y US2 funcionan.

---

## Phase 5: User Story 3 - Catálogo sembrado (P2)

**Goal**: sembrado idempotente con 4 productos (uno agotado) y sin endpoint de creación.

**Independent Test**: escenarios US3-1..3 de [quickstart.md](quickstart.md).

### Tests primero

- [ ] T025 [P] [US3] Test de `seedProducts` (≥ 3 productos con stock > 0; dos ejecuciones generan los mismos `PutItem` con los mismos ids; propaga error) en `backend/src/seed.spec.ts`
- [ ] T026 [P] [US3] Test e2e: `POST /products` → 404 en `backend/test/products.e2e.spec.ts`

### Implementación

- [ ] T027 [US3] Implementar `backend/src/seed.ts` (`SEED_PRODUCTS`, `seedProducts`, main protegido por `require.main === module`) y el script `npm run seed`

---

## Phase 6: Polish & transversal

- [ ] T028 Test del handler `backend/src/lambda.spec.ts`: evento HTTP API v2 `GET /products` con DynamoDB mockeado → 200. Implementar `backend/src/lambda.ts` (instancia cacheada entre invocaciones)
- [ ] T029 [P] Implementar `backend/src/main.ts` (bootstrap local con `createApp`)
- [ ] T030 Correr `npm test -- --coverage`, verificar ≥ 80 % (meta 90) y registrar el resultado en el PR
- [ ] T031 [P] Actualizar la sección Backend del `README.md` (cómo correr tests y endpoints del catálogo)

---

## Dependencies & Execution Order

- Setup (T001–T003) → Foundational (T004–T012) → US1 → US2 → US3 → Polish.
- US2 reutiliza el controlador y el adaptador de US1 (mismo archivo), así que va después de US1.
- US3 solo depende de Foundational y puede ir en paralelo con US1/US2.
- Dentro de cada fase, primero los tests [P] (red) y después la implementación (green); luego
  refactor.

## Parallel Example: User Story 1

```text
T013 list-products.spec.ts  |  T014 dynamo-product.repository.spec.ts  |  T015 products.e2e.spec.ts
```

## Implementation Strategy

- MVP = Setup + Foundational + US1 (catálogo visible).
- Después, US2 (detalle + fees para el resumen de pago) y US3 (sembrado para el despliegue).
- Commits: `test(...)` en red → `feat(...)` en green → `refactor(...)` si aplica.
