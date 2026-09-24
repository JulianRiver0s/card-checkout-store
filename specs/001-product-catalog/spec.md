# Feature Specification: Catálogo de productos y stock

**Feature Branch**: `001-product-catalog`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "API de catálogo: listar los productos de la tienda con descripción, precio y unidades disponibles en stock, y consultar un producto por id. La base de datos se siembra con productos dummy; no existe endpoint para crear productos. La respuesta incluye los cargos fijos de compra (tarifa base y tarifa de envío) para que el cliente pueda armar el resumen de pago."

## Clarifications

### Session 2026-09-23

- Q: ¿Cómo se cobran la tarifa base y la tarifa de envío? → A: Fijos por compra (base COP 3.000 +
  envío COP 10.000), una sola vez sin importar la cantidad de unidades.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el catálogo con stock disponible (Priority: P1)

Un cliente abre la tienda y ve los productos disponibles con nombre, descripción, foto, precio y
cuántas unidades quedan en stock, para decidir qué comprar.

**Why this priority**: es el paso 1 del flujo de compra; sin catálogo no hay compra posible.

**Independent Test**: consultar el catálogo de una tienda sembrada y verificar que cada producto
trae todos sus datos y un stock que coincide con el inventario almacenado.

**Acceptance Scenarios**:

1. **Given** una tienda sembrada con productos, **When** el cliente consulta el catálogo,
   **Then** recibe todos los productos con id, nombre, descripción, imagen, precio en pesos
   colombianos y unidades disponibles.
2. **Given** un producto con 0 unidades, **When** el cliente consulta el catálogo, **Then** el
   producto sigue apareciendo con 0 unidades disponibles (agotado) y no desaparece.
3. **Given** una tienda sin productos, **When** el cliente consulta el catálogo, **Then** recibe
   una lista vacía (no un error).

---

### User Story 2 - Ver el detalle de un producto con los cargos de compra (Priority: P1)

Un cliente elige un producto y ve su detalle junto con los cargos fijos que se suman a toda
compra (tarifa base y tarifa de envío), para conocer el costo total antes de pagar.

**Why this priority**: el resumen de pago (paso 3) necesita el precio y los cargos exactos; el
cliente no debe descubrir costos al final.

**Independent Test**: consultar un producto existente por su identificador y verificar el detalle
y los cargos; consultar uno inexistente y uno con identificador mal formado y verificar las
respuestas de error.

**Acceptance Scenarios**:

1. **Given** un producto existente, **When** el cliente lo consulta por id, **Then** recibe sus
   datos y los cargos de compra (tarifa base y tarifa de envío) en pesos colombianos.
2. **Given** un id bien formado que no corresponde a ningún producto, **When** el cliente lo
   consulta, **Then** recibe una respuesta de "no encontrado".
3. **Given** un id mal formado, **When** el cliente lo consulta, **Then** recibe una respuesta de
   "solicitud inválida" sin llegar a buscar el producto.

---

### User Story 3 - Catálogo inicial sembrado (Priority: P2)

El operador de la tienda despliega el sistema y el catálogo queda listo con productos de prueba,
sin que exista ninguna forma pública de crear productos.

**Why this priority**: la prueba exige una base sembrada y prohíbe crear productos por API; el
sembrado también habilita las demostraciones.

**Independent Test**: ejecutar el sembrado dos veces sobre un almacenamiento vacío y verificar que
el catálogo tiene exactamente los productos esperados, sin duplicados; verificar que no existe
operación pública de creación.

**Acceptance Scenarios**:

1. **Given** un almacenamiento vacío, **When** el operador ejecuta el sembrado, **Then** el
   catálogo contiene al menos 3 productos con stock mayor que 0.
2. **Given** un catálogo ya sembrado, **When** el operador ejecuta el sembrado otra vez, **Then**
   no se crean duplicados.
3. **Given** cualquier cliente, **When** intenta crear un producto a través de la API, **Then** la
   operación no existe.

### Edge Cases

- El almacenamiento no está disponible: el cliente recibe un error genérico, sin detalles
  internos (stack traces, nombres de tablas).
- Parámetros o campos inesperados en la consulta: se ignoran o rechazan; nunca alteran la
  respuesta.
- Precios y cargos siempre son enteros en centavos; no hay redondeos de punto flotante.
- El stock almacenado nunca es negativo; si lo fuera por un error de datos, el producto se
  presenta como agotado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST listar todos los productos con: id, nombre, descripción, URL de
  imagen, precio (centavos de COP, entero) y unidades disponibles (entero ≥ 0).
- **FR-002**: El sistema MUST permitir consultar un producto por su id.
- **FR-003**: El sistema MUST responder "no encontrado" cuando el id no existe.
- **FR-004**: El sistema MUST rechazar como "solicitud inválida" un id con formato inválido.
- **FR-005**: El sistema MUST incluir en el catálogo los productos agotados, con 0 unidades.
- **FR-006**: El sistema MUST exponer los cargos de compra junto al producto: tarifa base
  (siempre se cobra) y tarifa de envío, ambas en centavos de COP y fijas por compra (no se
  multiplican por la cantidad). Valores por defecto: base COP 3.000 y envío COP 10.000,
  configurables sin cambiar código.
- **FR-007**: El sistema MUST proveer un sembrado idempotente con al menos 3 productos dummy.
- **FR-008**: El sistema MUST NOT exponer ninguna operación pública para crear, editar o borrar
  productos.
- **FR-009**: El sistema MUST responder a errores internos con un mensaje genérico, sin filtrar
  detalles de infraestructura.
- **FR-010**: El contrato de la API MUST estar documentado y ser navegable públicamente.
- **FR-011**: Las respuestas MUST incluir headers de seguridad estándar y solo aceptar solicitudes
  de navegador provenientes del origen del frontend.

### Key Entities

- **Producto**: artículo a la venta. Atributos: id, nombre, descripción, imagen, precio unitario
  y unidades disponibles en stock.
- **Cargos de compra**: montos fijos que se suman a toda compra. La tarifa base se cobra siempre
  y la tarifa de envío cubre la entrega. No dependen del producto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una conexión móvil 4G, el cliente ve el catálogo completo en menos de 2 segundos.
- **SC-002**: El 100 % de los productos muestra unidades disponibles iguales a las del inventario
  en el momento de la consulta.
- **SC-003**: Ejecutar el sembrado N veces deja exactamente el mismo catálogo que ejecutarlo una
  vez.
- **SC-004**: Cada escenario de aceptación de este documento está cubierto por al menos una prueba
  automatizada, con cobertura de código ≥ 80 %.

## Assumptions

- Moneda única: pesos colombianos (COP). Los montos se manejan en centavos enteros.
- El catálogo es público: consultarlo no requiere autenticación.
- El catálogo es pequeño (menos de 50 productos), así que no se pagina.
- Las imágenes de producto se sirven como archivos estáticos optimizados para web desde el mismo
  CDN del frontend.
- Descontar y reservar stock es responsabilidad de la feature de checkout (002). Esta feature
  solo lee el stock.
