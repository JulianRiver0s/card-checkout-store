# Checkout Store

**Live API:** https://mzat0e1xi2.execute-api.us-east-1.amazonaws.com/products · **Docs (Swagger):** https://mzat0e1xi2.execute-api.us-east-1.amazonaws.com/docs

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

## Deploy (AWS SAM)

Infrastructure as code lives in [`template.yaml`](template.yaml): DynamoDB table, Lambda (`nodejs24.x`, arm64) running the NestJS app through `@codegenie/serverless-express`, and an API Gateway HTTP API with throttling.

```bash
aws login                                   # short-lived credentials
(cd backend && npm ci && npm run build)
sam build
sam deploy --guided                         # first time: stack card-checkout-store, us-east-1 (writes samconfig.toml, git-ignored)
TABLE=$(aws cloudformation describe-stacks --stack-name card-checkout-store   --query "Stacks[0].Outputs[?OutputKey=='ProductsTableName'].OutputValue" --output text)
(cd backend && PRODUCTS_TABLE=$TABLE npm run seed)   # idempotent, never overwrites stock
./scripts/smoke-api.sh <ApiUrl>             # post-deploy smoke test
```
