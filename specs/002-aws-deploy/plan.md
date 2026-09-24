# Implementation Plan: Despliegue en AWS (walking skeleton)

**Branch**: `002-aws-deploy` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-aws-deploy/spec.md`

## Summary

Plantilla AWS SAM (`template.yaml` en la raíz) con la tabla DynamoDB de productos, la función
Lambda del API NestJS y una HTTP API con throttling. La API queda desplegada y sembrada en
`us-east-1`, y un smoke test con `curl` verifica el despliegue. Decisiones en
[research.md](research.md).

## Technical Context

**Language/Version**: YAML (CloudFormation + transform SAM); bash para el smoke test.

**Primary Dependencies**: AWS SAM CLI 1.166, AWS CLI 2.37, cfn-lint (incluido en
`sam validate --lint`).

**Storage**: DynamoDB `ProductsTable` (on-demand, PK `id` string).

**Testing**: `sam validate --lint` + `scripts/smoke-api.sh`. Los tests de backend (Jest) no
cambian.

**Target Platform**: AWS `us-east-1`, Lambda `nodejs24.x` arm64 detrás de API Gateway HTTP API.

**Project Type**: infraestructura del web-service.

**Performance Goals**: `/products` en caliente < 1 s y en frío < 5 s (SC-002).

**Constraints**: free tier; sin Docker; sin secretos ni marca en la plantilla.

**Scale/Scope**: un stack y un ambiente.

## Constitution Check

| Principio | Cumplimiento | Estado |
|---|---|---|
| I. Test-First | El smoke test se escribe y falla antes del deploy. `sam validate --lint` en CI | ✅ |
| II. Hexagonal | Sin cambios al código. `lambda.ts` sigue siendo el único adaptador de entrada | ✅ |
| III. Seguridad | HTTPS-only (API Gateway), permisos de solo lectura (`DynamoDBReadPolicy`), throttling, sin secretos en la plantilla | ✅ |
| IV. Marca | Parámetros sin defaults que la contengan. El guard de CI cubre `template.yaml` | ✅ |
| V. Simplicidad | Un solo template, builder npm por defecto, sin Makefile ni contenedores | ✅ |

## Project Structure

```text
template.yaml                 # SAM: ProductsTable, ApiFunction, ApiLogGroup, HttpApi
scripts/smoke-api.sh          # smoke test post-deploy
backend/package.json          # + "files": ["dist"]
.github/workflows/ci.yml      # + job infra: sam validate --lint
specs/002-aws-deploy/         # spec, plan, research, quickstart, tasks
```

**Structure Decision**: la plantilla va en la raíz porque en 003/004 crece con el frontend
(S3 + CloudFront) y las tablas del checkout.

## Complexity Tracking

Sin violaciones.
