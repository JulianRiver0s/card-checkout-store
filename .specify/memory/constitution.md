# Checkout Store Constitution

## Core Principles

### I. Test-First (NO NEGOCIABLE)

- Todo comportamiento nuevo nace de un test que falla (red → green → refactor).
- Cada escenario de aceptación de un `spec.md` DEBE tener al menos un test automatizado que lo
  verifique.
- En `tasks.md` las tareas de test DEBEN aparecer antes de las tareas de implementación que cubren.
- Los commits reflejan el ciclo: `test: … (red)` → `feat: …` / `fix: …` → `refactor: …`.
- Los tests se escriben con **Jest** en backend y frontend. Cada `jest.config` DEBE declarar
  `coverageThreshold` global ≥ 80 % (statements, branches, functions, lines); la meta del equipo
  es ≥ 90 %. Solo se excluyen de cobertura los archivos de arranque (`main.ts`, `lambda.ts`,
  `main.tsx`).

Razón: la cobertura > 80 % es requisito de entrega y el historial de commits es evidencia del
proceso.

### II. Arquitectura Hexagonal y ROP

- El backend separa `domain/` (reglas puras, sin Nest ni AWS), `application/` (casos de uso y
  puertos) e `infrastructure/` (adaptadores HTTP, DynamoDB y pasarela de pagos).
- Los controladores NO contienen lógica de negocio: solo traducen HTTP ↔ caso de uso ↔ HTTP.
- Los casos de uso retornan `Result`/`ResultAsync` (`neverthrow`) y encadenan pasos con
  `andThen`/`map` (Railway Oriented Programming). No se lanzan excepciones para errores de
  negocio; los errores de dominio son valores tipados que un único mapper convierte en status
  HTTP.
- Un puerto existe solo si tiene un adaptador real y un fake de test; no hay abstracciones sin
  uso.

Razón: aislar la lógica de negocio la hace testeable con fakes en memoria y cumple el
patrón Ports & Adapters que exige la prueba.

### III. Seguridad de Datos Sensibles

- El número de tarjeta (PAN) y el CVC NUNCA llegan a nuestro backend, a logs, a Redux persistido
  ni a `localStorage`. El frontend tokeniza directo contra la pasarela con la llave pública y
  solo envía el token al backend. Del medio de pago solo se persisten `brand` y `last4`.
- Llaves y secretos viven en variables de entorno (`.env` ignorado por git, `.env.example` con
  placeholders; parámetros `NoEcho` en AWS). Ningún secreto se commitea.
- Toda entrada externa se valida en la frontera (DTOs con `class-validator`, `whitelist` y
  `forbidNonWhitelisted`). El total a cobrar lo calcula el backend; nunca se confía en montos
  enviados por el cliente.
- HTTPS en todo el tráfico, headers de seguridad (`helmet` en la API; HSTS, CSP, nosniff,
  frame-options y referrer-policy en CloudFront) y CORS restringido al dominio del frontend,
  siguiendo OWASP.

Razón: manejar datos de pago con seguridad es un criterio explícito de evaluación.

### IV. Confidencialidad de Marca

- El nombre de la empresa evaluadora NO aparece en ninguna parte del repositorio: nombre del
  repo, código, documentación, ramas ni mensajes de commit. Se usa "payment provider" (código) o
  "pasarela de pagos" (docs).
- El enunciado de la prueba (PDF) no se commitea.
- CI DEBE fallar si `git grep -i` encuentra el nombre.

Razón: es una condición de la prueba; incumplirla invalida la entrega.

### V. Simplicidad y HTTP Correcto

- YAGNI: no se agrega código, dependencia ni configuración "para después". Se prefiere
  plataforma nativa (CSS, fetch, crypto de Node, condiciones de DynamoDB) antes que librerías.
- Montos siempre en centavos enteros (COP); nunca se usan floats para dinero.
- La API usa verbos y códigos HTTP con semántica correcta: 200, 201, 400, 404, 409 (conflicto de
  stock o idempotencia), 422 (regla de negocio), 502 (falla de la pasarela).
- Las operaciones de pago son idempotentes (`Idempotency-Key`) y los cambios de stock usan
  escrituras condicionales para impedir sobreventa.

Razón: el código simple es más fácil de revisar y de defender en la entrevista.

## Restricciones Técnicas

- **Frontend**: SPA en React + Vite + Redux Toolkit (arquitectura Flux). Mobile-first con
  referencia iPhone SE (375×667 CSS px); responsive hasta escritorio; CSS propio (CSS Modules)
  con flexbox/grid, sin framework CSS. Flujo de 5 pasos: Producto → Tarjeta/Entrega (modal) →
  Resumen (backdrop) → Estado final → Producto. El progreso sobrevive a un refresh.
- **Backend**: NestJS (TypeScript) sobre AWS Lambda + API Gateway (HTTP API). Persistencia en
  DynamoDB. Recursos obligatorios: products (stock), transactions, customers, deliveries. La BD
  se siembra con productos dummy; no hay endpoint para crear productos. Documentación OpenAPI
  pública en `/docs`.
- **Infraestructura como código**: AWS SAM (`template.yaml`). Frontend en S3 privado + CloudFront.
- **Pasarela de pagos**: solo ambiente sandbox; URLs y llaves por configuración.
- **Idioma**: especificaciones y documentación en español; código, identificadores y commits en
  inglés.

## Flujo de Desarrollo

- Spec-Driven Development con spec-kit, una feature por rama (`NNN-slug`) y un PR por feature
  hacia `main`: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-checklist`
  → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement` → `/speckit-converge`.
- Un PR solo se mergea con CI en verde: tests + umbral de cobertura en backend y frontend y el
  guard de marca.
- Commits pequeños y frecuentes, en inglés, con Conventional Commits.
- El README se mantiene al día: arquitectura, modelo de datos, endpoints + URL de Swagger,
  resultados de cobertura, URLs desplegadas y decisiones de diseño.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del repo. `/speckit-plan` y
  `/speckit-analyze` DEBEN verificar el cumplimiento y justificar por escrito cualquier desvío
  (sección *Complexity Tracking* del plan).
- Enmiendas: PR que modifique este archivo, con la justificación y el bump de versión semántico
  (MAJOR: se elimina o redefine un principio; MINOR: principio o sección nueva; PATCH: redacción).
- Todo PR se revisa contra los principios I–V antes del merge.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
