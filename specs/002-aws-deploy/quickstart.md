# Quickstart: Despliegue en AWS (002)

## Prerrequisitos

- AWS CLI ≥ 2.32 con sesión vigente (`aws login`) y SAM CLI.
- Node 24 + npm.

## Validar la plantilla

```bash
sam validate --lint
```

## Desplegar

```bash
(cd backend && npm ci && npm run build)
sam build
sam deploy --guided        # la primera vez: stack card-checkout-store, us-east-1, guarda samconfig.toml
# siguientes veces: sam build && sam deploy
```

## Sembrar

```bash
TABLE=$(aws cloudformation describe-stacks --stack-name card-checkout-store \
  --query "Stacks[0].Outputs[?OutputKey=='ProductsTableName'].OutputValue" --output text)
(cd backend && PRODUCTS_TABLE=$TABLE npm run seed)
```

## Verificar

```bash
API=$(aws cloudformation describe-stacks --stack-name card-checkout-store \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
./scripts/smoke-api.sh "$API"
```

| Spec | Chequeo del smoke test | Esperado |
|---|---|---|
| US1-1 | `GET /products` | 200 y 4 productos |
| US1-2 | `GET /docs` | 200 HTML |
| US1-3 | `GET /products/abc` | 400 |
| US1-4 | headers | `x-content-type-options: nosniff`, CSP presente, sin `x-powered-by` |
| SC-002 | tiempo de `GET /products` en caliente | < 1 s |
