# Design System — Proyecto Alcaldía

## Filosofía
Estilo **SaaS confidence**: profesional, limpio, alta legibilidad. Paleta slate con alto contraste y acentos sobrios. Nada de colores chillones ni degradados.

---

## Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#f8fafc` (slate-50) | Fondo principal |
| `--bg-secondary` | `#f1f5f9` (slate-100) | Fondo secundario, sidebar |
| `--bg-white` | `#ffffff` | Superficies, cards |
| `--text-primary` | `#0f172a` (slate-900) | Texto principal, títulos |
| `--text-secondary` | `#475569` (slate-600) | Texto secundario, labels |
| `--text-tertiary` | `#94a3b8` (slate-400) | Texto muted, placeholders |
| `--accent-color` | `#1e293b` (slate-800) | Botones primary, acentos |
| `--accent-hover` | `#0f172a` (slate-900) | Hover de botones |
| `--border-color` | `#e2e8f0` (slate-200) | Bordes |
| `--border-focus` | `#64748b` (slate-500) | Bordes en focus |

---

## Border Radius

| Elemento | Valor |
|----------|-------|
| Botones, inputs, selects, cards, nav items | **12px** |
| Chart cards, stat cards | **12px** |
| Tags/badges, botones inline (CRUD) | **6px** |
| Toggle switch | **24px** (pill) |

Regla: **siempre 12px** salvo excepciones. No mezclar 10px, 12px, 16px en el mismo nivel de jerarquía.

---

## Tipografía

| Nivel | Tamaño | Peso | Color |
|-------|--------|------|-------|
| Título de página | 24px | 600 | `--text-primary` |
| Título de sección | 20px | 600 | `--text-primary` |
| Labels de formulario | 12px | 500 | `--text-secondary` |
| Inputs / selects | 13px | 400 | `--text-primary` |
| Botones primary | 13px | 500 | `#ffffff` |
| Texto de lista (crud-name) | 14px | 500 | `--text-primary` |
| Meta texto (crud-meta) | 13px | 400 | `--text-tertiary` |
| Counter / caption | 12px | 500 | `--text-tertiary` |

Font family: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## Espaciado y dimensiones

### Botones
- **Primary**: `padding: 8px 16px`, `font-size: 13px`, `border-radius: 12px`
- **Inline (CRUD)**: `padding: 5px 10px`, `font-size: 12px`, `border-radius: 6px`
- Save/Cancel en edición inline: heredan de `.crud-btn`

### Formularios
- **Inputs / selects**: `padding: 8px 12px`, `font-size: 13px`
- **Textarea**: `padding: 8px 12px`, `font-size: 13px`, `min-height: 100px`
- **Gap entre campos**: `16px` (form-row), `24px` (form)

### Cards y contenedores
- **CRUD item**: `padding: 14px 16px`
- **Sidebar**: `280px` ancho, `padding: 16px 12px` nav
- **Content body**: `padding: 32px`

---

## Estados

| Estado | Comportamiento |
|--------|---------------|
| **Focus** | `border-color: #64748b`, sin outline extra |
| **Hover (nav)** | `background: #e2e8f0`, `color: #0f172a` |
| **Hover (btn primary)** | `background: #0f172a` |
| **Activo (nav)** | `background: #ffffff`, `color: #0f172a`, `font-weight: 600` |
| **Hover (btn inline)** | `background: #e2e8f0` |

---

## Componentes

### Web Components
- Todos definidos en `src/view/components.js`
- Usan Shadow DOM con `mode: 'open'`
- Colores hardcodeados (no heredan variables CSS del :root)
- Deben mantener consistencia con la paleta definida aquí

### Lista de componentes
- `stat-card` — Tarjeta de estadística
- `line-chart` — Gráfico de línea
- `bar-chart` — Gráfico de barras
- `candle-chart` — Gráfico de velas
- `nav-menu-item` — Item de navegación
- `form-input` — Input de texto
- `form-textarea` — Área de texto
- `form-select` — Select desplegable
- `form-date` — Fecha (display)
- `form-toggle` — Toggle switch
- `button-primary` — Botón primario

---

## Reglas

1. No usar colores fuera de la paleta definida. Si se necesita un color nuevo, agregarlo como variable.
2. No usar `border-radius` distintos a 12px, 6px, o 24px (píldora).
3. No usar `box-shadow` sin necesidad. Preferir bordes planos.
4. Los formularios usan siempre el mismo padding y font-size en inputs/selects/textarea.
5. Los botones primary siempre llevan texto blanco sobre fondo `#1e293b`.
6. Mantener `transition: all 0.15s ease` para interacciones.
