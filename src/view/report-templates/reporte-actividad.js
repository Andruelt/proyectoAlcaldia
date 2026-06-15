function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function parseLocal(iso) {
    if (!iso) return null;
    const trimmed = String(iso).trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, d] = trimmed.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
}

function formatFechaCorta(iso) {
    const d = parseLocal(iso);
    if (!d) return iso || '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
}

function formatFechaLarga(iso) {
    const d = parseLocal(iso);
    if (!d) return iso || '';
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const val = (data, key, fallback = '') => {
    const v = data[key];
    return v === undefined || v === null ? fallback : v;
};

const PRIORIDAD_LABEL = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' };
const ESTADO_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', cancelado: 'Cancelado' };

export const reporteActividadTemplate = {
    id: 'reporte-actividad',
    name: 'Reporte de Actividad',
    description: 'Resumen ejecutivo de la actividad con observaciones y recomendaciones. Ideal como reporte individual.',
    icon: 'activity',
    fields: [
        { key: 'fecha', label: 'Fecha del reporte', type: 'date', required: true, group: 'Encabezado' },
        { key: 'periodo', label: 'Período (opcional)', type: 'text', placeholder: 'Semana 24, Mes, etc.', group: 'Encabezado' },
        { key: 'resumenEjecutivo', label: 'Resumen ejecutivo', type: 'longtext', rows: 4, placeholder: 'Resumen de la actividad realizada…', group: 'Contenido' },
        { key: 'observaciones', label: 'Observaciones', type: 'longtext', rows: 3, placeholder: 'Observaciones adicionales…', group: 'Contenido' },
        { key: 'recomendaciones', label: 'Recomendaciones', type: 'longtext', rows: 3, placeholder: 'Acciones recomendadas…', group: 'Contenido' },
        { key: 'tecnico', label: 'Técnico responsable', type: 'text', placeholder: 'Nombre del técnico', group: 'Cierre' },
        { key: 'cargoTecnico', label: 'Cargo del técnico', type: 'text', placeholder: 'Analista de Soporte', group: 'Cierre' },
    ],
    defaultValues(actividad, ctx) {
        return {
            fecha: ctx.fecha,
            periodo: actividad ? formatFechaLarga(actividad.created_at || '') : '',
            resumenEjecutivo: actividad?.descripcion || '',
            observaciones: '',
            recomendaciones: '',
            tecnico: '',
            cargoTecnico: '',
        };
    },
    renderPreview(data, ctx) {
        const fecha = data.fecha || ctx.fecha || new Date().toISOString();
        const actividad = ctx.actividad;
        return `
<article class="informe-doc informe-doc--reporte-actividad">
    <header class="ra-header">
        <div class="ra-eyebrow">Reporte de Actividad</div>
        <h1 class="ra-title">${esc(val(data, 'periodo', 'Reporte individual'))}</h1>
        <div class="ra-meta">Fecha: <strong>${esc(formatFechaCorta(fecha))}</strong></div>
    </header>
    ${actividad ? `
    <section class="ra-section">
        <div class="ra-section-title">Información general</div>
        <div class="ra-info-grid">
            <div><span class="ra-label">Dirección</span><span class="ra-value">${esc(actividad.direccion || '—')}</span></div>
            <div><span class="ra-label">Incidencia</span><span class="ra-value">${esc(actividad.incidencia || '—')}</span></div>
            <div><span class="ra-label">Estado</span><span class="ra-value">${esc(ESTADO_LABEL[actividad.estado || ''] || '—')}</span></div>
            <div><span class="ra-label">Prioridad</span><span class="ra-value">${esc(PRIORIDAD_LABEL[actividad.prioridad || ''] || '—')}</span></div>
            <div><span class="ra-label">Creada</span><span class="ra-value">${esc(formatFechaLarga(actividad.created_at || ''))}</span></div>
            <div><span class="ra-label">Resuelta</span><span class="ra-value">${actividad.resolved_at ? esc(formatFechaLarga(actividad.resolved_at)) : '—'}</span></div>
        </div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Descripción</div>
        <div class="ra-prose">${esc(actividad.descripcion || 'Sin descripción')}</div>
    </section>
    ` : ''}
    <section class="ra-section">
        <div class="ra-section-title">Resumen ejecutivo</div>
        <div class="ra-prose">${esc(val(data, 'resumenEjecutivo', actividad?.descripcion || '')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Observaciones</div>
        <div class="ra-prose">${esc(val(data, 'observaciones', 'Sin observaciones registradas.')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Recomendaciones</div>
        <div class="ra-prose">${esc(val(data, 'recomendaciones', 'Sin recomendaciones registradas.')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-signature">
        <div class="ra-sig-label">Atentamente,</div>
        <div class="ra-sig-name"><strong>${esc(val(data, 'tecnico', ''))}</strong></div>
        <div class="ra-sig-role">${esc(val(data, 'cargoTecnico', ''))}</div>
    </section>
</article>`;
    },
};
