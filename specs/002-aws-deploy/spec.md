# Feature Specification: Despliegue en AWS (walking skeleton)

**Feature Branch**: `002-aws-deploy`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Desplegar temprano el catálogo (001) en AWS con infraestructura como código: la API pública por HTTPS con `/products` y `/docs`, la base sembrada y un smoke test que verifique el despliegue. El hosting del frontend y las llaves de la pasarela llegan en las features siguientes."

## Clarifications

### Session 2026-09-23

- Sin ambigüedades críticas. El alcance (solo backend; frontend y pasarela después) lo decidió el
  usuario al elegir desplegar temprano.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo accesible públicamente por HTTPS (Priority: P1)

Un evaluador abre la URL pública de la API y ve el catálogo sembrado y la documentación, sin
instalar nada.

**Why this priority**: el despliegue vale 20 puntos, y desplegar temprano saca a la luz los
problemas de infraestructura antes de construir el checkout encima.

**Independent Test**: ejecutar el smoke test contra la URL publicada y verificar las respuestas.

**Acceptance Scenarios**:

1. **Given** el stack desplegado y sembrado, **When** se consulta `/products` por HTTPS,
   **Then** responde 200 con los 4 productos sembrados.
2. **Given** el stack desplegado, **When** se abre `/docs`, **Then** responde 200 con la
   documentación de la API.
3. **Given** el stack desplegado, **When** se consulta un producto con un id mal formado,
   **Then** responde 400.
4. **Given** el stack desplegado, **When** llega cualquier respuesta, **Then** incluye headers de
   seguridad (nosniff, CSP) y no revela la tecnología del servidor.

---

### User Story 2 - Infraestructura reproducible (Priority: P1)

El operador recrea todo el backend desde el repositorio con un comando de build y otro de
deploy, sin pasos manuales en la consola de AWS.

**Why this priority**: la prueba evalúa infraestructura como código; un despliegue manual no es
reproducible ni revisable.

**Independent Test**: validar la plantilla con el linter y desplegarla en una cuenta limpia
siguiendo solo el README.

**Acceptance Scenarios**:

1. **Given** el repositorio, **When** se valida la plantilla, **Then** pasa el linter sin errores.
2. **Given** una cuenta AWS con credenciales, **When** se ejecutan los comandos documentados,
   **Then** se crean la tabla, la función y la API, y el stack expone la URL de la API.
3. **Given** el stack ya desplegado, **When** se despliega de nuevo sin cambios, **Then** no se
   modifica ningún recurso.

### Edge Cases

- Tráfico abusivo: la API limita la tasa de solicitudes para proteger costos y disponibilidad.
- Cold start: la primera solicitud después de un periodo inactivo termina en menos de 5 segundos.
- Logs: se conservan por un periodo acotado; no crecen indefinidamente.
- Secretos: la plantilla no contiene llaves ni URLs de la pasarela. Llegan como parámetros en el
  momento del despliegue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La API MUST estar disponible públicamente solo por HTTPS.
- **FR-002**: La infraestructura (tabla, función, API, permisos y logs) MUST estar definida como
  código versionado en el repositorio.
- **FR-003**: La función MUST tener solo los permisos mínimos sobre la tabla de productos
  (lectura en esta feature).
- **FR-004**: La API MUST limitar la tasa de solicitudes (throttling).
- **FR-005**: Los logs de la función MUST tener una retención acotada.
- **FR-006**: El despliegue MUST exponer como salida la URL pública de la API y el nombre de la
  tabla.
- **FR-007**: Un smoke test automatizado MUST verificar los escenarios de US1 contra la URL
  desplegada.
- **FR-008**: La plantilla MUST NOT contener secretos ni el nombre de la empresa evaluadora.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El smoke test pasa al 100 % contra el stack desplegado.
- **SC-002**: Una solicitud en caliente a `/products` responde en menos de 1 segundo, y una en
  frío en menos de 5.
- **SC-003**: El costo mensual del stack con tráfico de demostración es USD 0 (dentro del free
  tier).
- **SC-004**: Un despliegue desde cero toma menos de 10 minutos siguiendo solo el README.

## Assumptions

- Región `us-east-1`, una sola cuenta y un solo ambiente (sin staging).
- El operador tiene credenciales de AWS vigentes (`aws login`).
- El dominio por defecto de API Gateway es suficiente (sin dominio propio).
- El hosting del frontend (S3 + CloudFront y sus headers) y los parámetros de la pasarela se
  agregan en las features 003/004 sobre esta misma plantilla.
