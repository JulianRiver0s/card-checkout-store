---
description: "Task list for 002-aws-deploy"
---

# Tasks: Despliegue en AWS (walking skeleton)

**Input**: Design documents from `/specs/002-aws-deploy/`

**Tests**: OBLIGATORIOS (Constitución I). El smoke test se escribe y falla antes del despliegue.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Agregar `"files": ["dist"]` a `backend/package.json` y verificar con `npm pack --dry-run` que solo se empaquetan `dist/` y `package.json`

## Phase 2: User Story 1 - Catálogo público por HTTPS (P1) 🎯 MVP

### Tests primero

- [X] T002 [US1] Escribir `scripts/smoke-api.sh` (US1-1..4 + SC-002) y verificar que falla sin API desplegada

### Implementación

- [X] T003 [US1] Escribir `template.yaml`: `ProductsTable`, `ApiFunction` (nodejs24.x, arm64, 1024 MB, `DynamoDBReadPolicy`, env `PRODUCTS_TABLE`/`CORS_ORIGIN`), `ApiLogGroup` (14 días), `HttpApi` con throttling y outputs `ApiUrl`/`ProductsTableName`
- [X] T004 [US1] `sam validate --lint` sin errores
- [X] T005 [US1] `sam build` + `sam deploy --guided` (stack `card-checkout-store`, `us-east-1`)
- [X] T006 [US1] Sembrar la tabla desplegada con `npm run seed`
- [X] T007 [US1] Correr `scripts/smoke-api.sh $ApiUrl` → verde

## Phase 3: User Story 2 - Infraestructura reproducible (P1)

- [ ] T008 [US2] Job `infra` en `.github/workflows/ci.yml` que corre `sam validate --lint`
- [ ] T009 [US2] Redesplegar sin cambios y verificar "No changes to deploy"
- [ ] T010 [P] [US2] Sección "Deploy" en `README.md` con los comandos del quickstart y la URL pública

## Dependencies & Execution Order

T001 → T002 (red) → T003–T007 (green) → T008–T010.
