# Checkout Store

Single-product store with a mobile-first card checkout (React + Redux) backed by a NestJS API on AWS Lambda + DynamoDB, integrated with a payment provider sandbox.

> Work in progress — built with Spec-Driven Development ([spec-kit](https://github.com/github/spec-kit)) and TDD. Specs live under [`specs/`](specs/), project principles in [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Backend (`backend/`)

NestJS 11 + TypeScript, hexagonal architecture (ports & adapters) with Railway Oriented Programming (`neverthrow`) in the use cases.

```text
src/
├── domain/          pure business rules (no Nest, no AWS)
├── application/     ports + use cases returning Result/ResultAsync
└── infrastructure/  HTTP controllers, DynamoDB adapters, config
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/products` | Catalog with `availableUnits` (sold-out products included) |
| GET | `/products/:id` | Product detail plus the fixed purchase `fees` (400 if the id is not a UUID v4, 404 if missing) |
| GET | `/docs` | OpenAPI / Swagger UI |

### Run

```bash
cd backend
npm ci
npm run test:cov        # Jest + coverage gate (80 % global)
cp .env.example .env    # then: npm run build && npm run seed && npm start
```

### Coverage (feature 001)

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 100 % | 100 % | 100 % | 100 % |
