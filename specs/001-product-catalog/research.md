# Research: Catálogo de productos y stock (001)

## R1. Versión de NestJS

- **Decision**: NestJS **11.x** (CommonJS), con `@nestjs/cli` 11 y `@nestjs/swagger` 11.
- **Rationale**: NestJS 12.0.0 (27-ago-2026) publica sus paquetes como ESM puro (`"type": "module"`).
  La prueba exige Jest, y Jest con ESM necesita `--experimental-vm-modules`, deja de soportar
  `jest.mock` y pide `jest.unstable_mockModule`. La 11.x sigue recibiendo parches (11.2.6) y
  funciona con Jest y ts-jest sin configuración extra.
- **Alternatives considered**: Nest 12 + Jest ESM (frágil); Nest 12 + Vitest (incumple el
  requisito de usar Jest).

## R2. TypeScript

- **Decision**: fijar `typescript@~5.9`.
- **Rationale**: la última versión es la 7.0 (compilador nativo), pero `ts-jest@29.4` declara el
  peer `typescript >=4.3 <7` y `@nestjs/cli@11` trae TS 5.9.3. Con la 5.9 ambos quedan compatibles.
- **Alternatives considered**: TS 7 (rompe ts-jest); `@swc/jest` (evita el problema, pero SWC
  necesita configuración aparte para la metadata de decoradores).

## R3. Runtime y adaptador Lambda

- **Decision**: Lambda `nodejs24.x` (soportado hasta abr-2028) con
  `@codegenie/serverless-express@4.17` sobre API Gateway HTTP API (payload v2).
- **Rationale**: la 4.x es el fork mantenido de `@vendia/serverless-express`, está probada con
  Express y es CJS. La 5.0 exige Node ≥ 24 y es reciente; no aporta nada que necesitemos.
- **Alternatives considered**: `@nestjs/platform-fastify` + `aws-lambda-fastify` (más piezas);
  Lambda Web Adapter (capa extra y más difícil de probar con Jest).
- **Riesgo**: Nest 11 usa Express 5. Lo mitiga un test que invoca el handler de `lambda.ts` con
  un evento HTTP API v2 real y DynamoDB mockeado.

## R4. Persistencia

- **Decision**: tabla DynamoDB `products` en modo on-demand, PK `id` (UUID v4). `GET /products`
  usa `Scan` y `GET /products/:id` usa `GetItem`. Cliente `@aws-sdk/lib-dynamodb`
  (DocumentClient).
- **Rationale**: son menos de 50 productos (supuesto del spec). Un `Scan` sobre una tabla tan
  pequeña cuesta lo mismo que un `Query` y no necesita índices.
- **Alternatives considered**: diseño single-table con GSI (más difícil de explicar para cuatro
  entidades simples).
- **Límite conocido**: con más de ~1 MB de productos el `Scan` pagina. Si el catálogo crece, se
  pasa a una consulta paginada con `LastEvaluatedKey`.

## R5. Configuración

- **Decision**: una función `loadConfig(env)` que lee `process.env`, aplica defaults
  (`BASE_FEE_IN_CENTS=300000`, `DELIVERY_FEE_IN_CENTS=1000000`) y falla al arrancar si un valor
  no es un entero seguro ≥ 0.
- **Rationale**: son cinco variables; `@nestjs/config` + Joi agregaría dos dependencias para eso
  (principio V).
- **Alternatives considered**: `@nestjs/config`.

## R6. Validación y errores (ROP)

- **Decision**:
  - Los ids se validan con `ParseUUIDPipe({ version: '4' })` y un id mal formado da 400.
  - `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` es
    global.
  - Los casos de uso retornan `ResultAsync<T, AppError>` (`neverthrow`). `AppError` es una unión
    discriminada (`NOT_FOUND | VALIDATION | CONFLICT | BUSINESS_RULE | PROVIDER | UNEXPECTED`).
  - Un único helper `toHttp(result)` convierte un `Err` en la `HttpException` correspondiente.
  - Un `UNEXPECTED` responde 500 con el mensaje genérico `"Internal server error"` y el detalle
    solo se registra en logs.
- **Rationale**: los controladores quedan en una sola línea, el mapeo de errores vive en un
  único punto y los casos de uso no lanzan excepciones (principio II).

## R7. Seguridad HTTP

- **Decision**:
  - `helmet()` con la configuración por defecto.
  - CORS con `origin` tomado de `CORS_ORIGIN` (lista separada por comas) y métodos
    `GET,POST,PATCH`.
  - `/docs` sirve Swagger UI. `@nestjs/swagger` 11 inyecta el init de la UI como archivo externo
    (`swagger-ui-init.js`), así que la CSP de helmet no la bloquea.
- **Rationale**: son las recomendaciones de OWASP (bonus de la prueba). La API solo recibe
  llamadas del dominio del frontend.

## R8. Sembrado

- **Decision**: `src/seed.ts` exporta `SEED_PRODUCTS` y `seedProducts(docClient, table)`, que
  hace `PutItem` con ids UUID fijos (idempotente por construcción). Se ejecuta con
  `npm run seed` (`node dist/seed.js`, protegido por `require.main === module`).
- **Rationale**: no agrega dependencias (ni ts-node ni tsx), queda cubierto por Jest y con ids
  fijos N ejecuciones producen el mismo catálogo (SC-003).
- **Datos**: 4 productos. Tres con stock > 0 y uno agotado para mostrar el estado "agotado".
  Las imágenes (`/images/products/<slug>.webp`) las sirve el CDN del frontend (feature 003).

## R9. Estrategia de tests

- **Decision**: Jest 30 + ts-jest. Los tests unitarios van junto al código (`*.spec.ts`) y los
  e2e de HTTP en `test/*.e2e.spec.ts`, con `supertest` sobre la app creada por `createApp()` y
  el repositorio reemplazado por un fake en memoria.
  - El adaptador DynamoDB se prueba con `aws-sdk-client-mock`.
  - `lambda.ts` se prueba invocando el handler con DynamoDB mockeado.
  - `coverageThreshold` global de 80, excluyendo solo `main.ts`.
- **Rationale**: cada capa se prueba con su dependencia más barata y el fake en memoria es la
  recompensa de la arquitectura hexagonal.
