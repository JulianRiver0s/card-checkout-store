# Research: Despliegue en AWS (002)

## R1. Empaquetado de NestJS para Lambda

- **Decision**: `npm run build` (tsc vía `nest build`) antes de `sam build`. SAM usa su builder
  npm por defecto sobre `backend/`, con `"files": ["dist"]` en `package.json`, así que empaqueta
  solo `dist/` más las dependencias de producción.
- **Rationale**: `BuildMethod: esbuild` no emite `emitDecoratorMetadata`, y sin eso la inyección
  de dependencias de Nest se rompe. `BuildMethod: makefile` exige `make`, que no existe en Windows.
  El builder npm no necesita Docker.
- **Alternatives considered**: esbuild con plugin de metadata (más configuración); imagen de
  contenedor (requiere Docker).

## R2. Tipo de API

- **Decision**: API Gateway **HTTP API** con una ruta catch-all (`$default`) hacia la función. El
  CORS lo resuelve Nest (`enableCors`, ya probado en e2e).
- **Rationale**: menor latencia y costo que REST API. No necesitamos WAF, API keys ni usage plans.
  Tener el CORS en un solo lugar evita configuraciones duplicadas que diverjan.
- **Riesgo conocido**: las respuestas 429 del throttling de API Gateway no llevan headers CORS.
  Es aceptable: el front las ve como error de red y muestra reintento.

## R3. Función

- **Decision**: `nodejs24.x`, `arm64`, 1024 MB, timeout 29 s (el integration timeout de HTTP API es
  30 s).
- **Rationale**: arm64 es ~20 % más barato y las dependencias son JS puro. Con 1024 MB hay más CPU
  y el arranque de Nest baja a ~1–2 s en frío (SC-002).

## R4. Throttling

- **Decision**: `DefaultRouteSettings` del stage con `ThrottlingRateLimit: 20` y
  `ThrottlingBurstLimit: 40`.
- **Rationale**: holgado para una demo y acota el costo ante abuso (OWASP API4: consumo
  irrestricto de recursos).

## R5. Logs

- **Decision**: `AWS::Logs::LogGroup` explícito con `RetentionInDays: 14`, referenciado desde
  `LoggingConfig` de la función.
- **Rationale**: sin grupo explícito, Lambda crea uno con retención infinita.

## R6. Credenciales

- **Decision**: el operador usa `aws login` (credenciales temporales). SAM CLI y el SDK v3
  (sembrado) las toman de la cadena por defecto. Si alguna herramienta no reconoce ese tipo de
  sesión: `aws configure export-credentials --format env`.
- **Rationale**: nada de llaves de larga duración en disco.

## R7. Configuración y secretos

- **Decision**: `samconfig.toml` queda fuera de git porque guarda los valores de los parámetros.
  El README documenta `sam deploy --guided` para crearlo. En esta feature solo se parametriza
  `CorsOrigin`; los parámetros de la pasarela (llaves y URL) llegan en 003.

## R8. Smoke test

- **Decision**: `scripts/smoke-api.sh <api-url>` con `curl`. Verifica status y headers de los
  escenarios de US1 y sale con código ≠ 0 si algo falla.
- **Rationale**: sin dependencias. Se escribe antes del despliegue (red) y pasa después (green).
