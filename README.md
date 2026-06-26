# Proyecto Alcaldía

Aplicación de escritorio para gestión de actividades técnicas municipales construida con Electron + TypeScript + Web Components. Permite registrar direcciones, incidencias y actividades, generar estadísticas, y producir informes técnicos en PDF / Word con plantillas personalizables.

## Características

- **Dashboard** con KPIs, gráficos de barras/línea y analíticas por período.
- **Gestión CRUD** de direcciones, incidencias y actividades (con soft-delete).
- **Vista de actividades** en formato cards, lista o calendario.
- **Constructor de informes** con plantillas predeterminadas (Informe Técnico oficial) y preview en vivo.
- **Exportación** a PDF y Word usando `docx` + render HTML para PDF.
- **Persistencia local** con `sql.js` (archivo `alcaldia.db` en `userData`).
- **Web Components** con Shadow DOM para UI reutilizable.

## Arquitectura

```
src/
├── main/                    # Proceso principal Electron
│   ├── main.ts              # Entry point, ventana, ciclo de vida
│   ├── database/
│   │   ├── database.ts      # Adaptador de sql.js, schema, migraciones, seed
│   │   ├── adapters/        # Adaptadores de dominio
│   │   │   └── named-entity.ts  # CRUD genérico para direcciones/incidencias
│   │   ├── actividades-adapter.ts
│   │   ├── metrics-adapter.ts
│   │   ├── seed.ts
│   │   └── ...
│   ├── ipc/                 # Handlers IPC modularizados
│   │   ├── index.ts         # Registro central
│   │   ├── crud.ts          # Handlers direcciones/incidencias
│   │   ├── actividades.ts
│   │   ├── metrics.ts
│   │   ├── reports.ts       # Genera y exporta PDFs/Word
│   │   ├── templates.ts     # Lista de plantillas para el builder
│   │   └── window.ts        # Controles de ventana
│   └── reports/             # Sistema de plantillas
│       ├── types.ts         # Tipos del dominio de informes
│       ├── registry.ts      # Registro de plantillas
│       ├── generator.ts     # Orquestador PDF/DOCX
│       ├── escape.ts
│       ├── date-format.ts
│       └── templates/
│           ├── informe-tecnico.ts        # Plantilla + render preview
│           ├── informe-tecnico-pdf.ts    # HTML/CSS del PDF pixel-perfect
│           ├── informe-tecnico-docx.ts   # Construcción DOCX
│           └── reporte-actividad.ts
├── preload/preload.ts       # Bridge IPC
├── types/                   # Definiciones globales
└── view/                    # Renderer
    ├── index.html
    ├── styles.css
    ├── app.js               # Entry: bootstrap y navegación
    ├── ui/                  # Componentes, base, utils
    │   ├── index.js
    │   ├── registry.js
    │   ├── base/
    │   ├── components/     # Web Components (form-*, button-*, etc.)
    │   ├── tokens.js
    │   ├── icons.js
    │   ├── date-utils.js
    │   └── utils/           # escape, ipc, icons
    ├── modules/             # Lógica de vistas
    │   ├── router.js
    │   ├── crud.js          # CRUD de direcciones/incidencias
    │   ├── actividades.js
    │   ├── actividad-modal.js
    │   ├── dashboard.js
    │   ├── analytics.js
    │   └── informe.js       # Builder de informes
    └── report-templates/    # Mirror JS para preview en el renderer
```

## Sistema de plantillas de informes

Cada plantilla se define declarativamente como un objeto `ReportTemplate` con:

- `id`, `name`, `description`, `icon`: metadatos.
- `fields`: array de campos (`text`, `longtext`, `date`, `number`) con label, placeholder, grupo.
- `defaultValues(actividad, ctx)`: rellena automáticamente desde una actividad.
- `renderPreview(data, ctx)`: HTML para el preview en vivo.
- `renderPdfHtml(data, ctx)`: HTML completo (con CSS) para `printToPDF`.
- `buildDocx(data, ctx)`: array de elementos `docx` para empaquetar en un `.docx`.

El builder se compone de:
1. **Listado de actividades** (sidebar izquierda) — el usuario selecciona una para autollenar.
2. **Selector de plantilla** (píldoras con descripción) — al cambiar, se actualiza el formulario.
3. **Formulario dinámico** (`<report-builder>`) — se regenera a partir de los campos de la plantilla.
4. **Preview en vivo** — refleja cada cambio de campo en tiempo real.
5. **Botones de exportación** — PDF o Word, con diálogo nativo de guardado.

### Añadir una nueva plantilla

1. Crear `src/main/reports/templates/mi-plantilla.ts` con la implementación completa.
2. (Opcional) Crear `src/view/report-templates/mi-plantilla.js` con la versión preview-only.
3. Registrar la plantilla en `src/main/reports/registry.ts` y en `src/view/report-templates/index.js`.
4. Listo — aparecerá automáticamente en el builder y en `get-report-templates`.

## Comandos

```bash
npm install
npm run build    # Compila TS + bundle UI y app
npm start        # Build + abre la app
npm run seed     # Build + ejecuta el seed de la base de datos
npm test         # Build + ejecuta tests de DB
```

## Estructura de la base de datos

- `direcciones(id, nombre, created_at, updated_at, deleted_at)`
- `incidencias(id, nombre, created_at, updated_at, deleted_at)`
- `actividades(id, direccion_id, incidencia_id, descripcion, estado, prioridad, created_at, updated_at, resolved_at, deleted_at)`
- `actividad_log(id, actividad_id, campo, valor_anterior, valor_nuevo, created_at)`
- `metricas(id, fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d, created_at)`

Todas las tablas usan soft-delete (`deleted_at IS NULL`).
