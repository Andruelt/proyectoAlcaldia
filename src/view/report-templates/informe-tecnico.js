function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const DEFAULT_COMPONENTES = [
    { nombre: 'Tarjeta Madre', estado: '' },
    { nombre: 'Procesador', estado: '' },
    { nombre: 'Memoria', estado: '' },
    { nombre: 'Disco Duro', estado: '' },
    { nombre: 'Fuente de Poder', estado: '' },
    { nombre: 'Unidad Óptica', estado: '' },
];

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

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const val = (data, key, fallback = '') => {
    const v = data[key];
    return v === undefined || v === null ? fallback : v;
};

function getComponentes(data) {
    const raw = data.componentes;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [];
}

function shouldShowComponents(data) {
    return getComponentes(data).length > 0;
}

export const informeTecnicoTemplate = {
    id: 'informe-tecnico',
    name: 'Informe Técnico',
    description: 'Formato oficial con membrete, datos del destinatario, equipo, componentes opcionales, diagnóstico y firmas.',
    icon: 'fileText',
    fields: [
        { key: 'fecha', label: 'Fecha', type: 'date', required: true, group: 'Encabezado' },
        { key: 'numeroInforme', label: 'N° de Informe', type: 'text', placeholder: 'Ej: 042', required: true, group: 'Encabezado' },
        { key: 'destinatarioNombre', label: 'Destinatario (Nombre)', type: 'text', placeholder: 'Nombre completo del destinatario', required: true, group: 'Destinatario' },
        { key: 'destinatarioCargo', label: 'Cargo', type: 'text', placeholder: 'Cargo del destinatario', group: 'Destinatario' },
        { key: 'destinatarioDpto', label: 'Departamento / Alcaldía', type: 'text', placeholder: 'Nombre del departamento o alcaldía', group: 'Destinatario' },
        { key: 'codigoBien', label: 'Código del Bien', type: 'text', placeholder: 'Código del equipo', group: 'Equipo' },
        { key: 'descripcion', label: 'Descripción del equipo', type: 'longtext', rows: 3, placeholder: 'Describe el equipo (marca, modelo, color, etc.)', group: 'Equipo' },
        { key: 'requerimiento', label: 'Requerimiento', type: 'longtext', rows: 3, placeholder: 'Describe el requerimiento o motivo', group: 'Equipo' },
        { key: '_placeholder', label: '', type: 'text', group: 'Componentes' },
        { key: 'diagnostico', label: 'Diagnóstico', type: 'longtext', rows: 4, placeholder: 'Detalle del diagnóstico técnico…', group: 'Diagnóstico' },
        { key: 'firma1', label: 'Firma 1', type: 'text', placeholder: 'Área o responsable de la firma', group: 'Firmas' },
        { key: 'firma2', label: 'Firma 2', type: 'text', placeholder: 'Área o responsable de la firma', group: 'Firmas' },
        { key: 'firma3', label: 'Firma 3', type: 'text', placeholder: 'Área o responsable de la firma', group: 'Firmas' },
    ],
    defaultValues(actividad, ctx) {
        const numero = actividad?.id ? actividad.id.replace(/-/g, '').substring(0, 6).toUpperCase() : '';
        return {
            fecha: ctx.fecha,
            numeroInforme: numero,
            destinatarioNombre: actividad?.direccion || '',
            destinatarioCargo: '',
            destinatarioDpto: 'ALCALDIA DE INFANTE',
            codigoBien: '',
            descripcion: actividad?.descripcion || '',
            requerimiento: actividad?.incidencia || '',
            componentes: DEFAULT_COMPONENTES.map(c => ({ ...c })),
            diagnostico: actividad?.descripcion || '',
            firma1: 'INFORMATICA Y SISTEMA',
            firma2: 'DIVISION DE REGISTRO Y CONTROL DE BIENES',
            firma3: 'RECIBIDO POR:',
        };
    },
    renderPreview(data, _ctx) {
        const fechaCorta = formatFechaCorta(data.fecha || new Date().toISOString());
        const showComponents = shouldShowComponents(data);
        const diag = val(data, 'diagnostico');

        const componentes = getComponentes(data);

        // Build grid rows: max 4 components per row
        const CHUNK = 4;
        const compRows = [];
        for (let i = 0; i < componentes.length; i += CHUNK) {
            const chunk = componentes.slice(i, i + CHUNK);
            const cells = chunk.map(c => `
                <td>
                    <div class="it-comp-name">${esc(c.nombre)}</div>
                    <div class="it-comp-estado">${esc(c.estado)}</div>
                </td>`).join('');
            const emptyCells = chunk.length < CHUNK
                ? '<td></td>'.repeat(CHUNK - chunk.length)
                : '';
            compRows.push(`<tr>${cells}${emptyCells}</tr>`);
        }

        const componentRowsHtml = showComponents ? `
    <table class="it-components">
        <tbody>
            ${compRows.join('')}
            ${diag ? `
            <tr>
                <td class="it-bold it-diagnostico" colspan="${CHUNK}"><strong>Diagnóstico:</strong> ${esc(diag).replace(/\n/g, '<br/>')}</td>
            </tr>` : ''}
        </tbody>
    </table>` : '';

        const simpleDiagRow = !showComponents && diag ? `
    <table class="it-equipment">
        <tbody>
            <tr>
                <td class="it-bold">Diagnóstico</td>
                <td colspan="2">${esc(diag).replace(/\n/g, '<br/>')}</td>
            </tr>
        </tbody>
    </table>` : '';

        return `
<article class="informe-doc informe-doc--informe-tecnico">
    <header class="it-header">
        <div class="it-header-logo">
            <svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
                <defs>
                    <linearGradient id="it-sun" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#7cb342"/>
                        <stop offset="100%" stop-color="#558b2f"/>
                    </linearGradient>
                </defs>
                <circle cx="40" cy="40" r="34" fill="#fff" stroke="#7cb342" stroke-width="1.5"/>
                <g fill="url(#it-sun)">
                    <circle cx="40" cy="40" r="7"/>
                    <g>
                        <rect x="38" y="14" width="4" height="12" rx="1.5"/>
                        <rect x="38" y="54" width="4" height="12" rx="1.5"/>
                        <rect x="14" y="38" width="12" height="4" rx="1.5"/>
                        <rect x="54" y="38" width="12" height="4" rx="1.5"/>
                    </g>
                    <g transform="rotate(45 40 40)">
                        <rect x="38" y="18" width="4" height="10" rx="1.5"/>
                        <rect x="38" y="52" width="4" height="10" rx="1.5"/>
                        <rect x="18" y="38" width="10" height="4" rx="1.5"/>
                        <rect x="52" y="38" width="10" height="4" rx="1.5"/>
                    </g>
                </g>
                <text x="40" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-weight="700" fill="#1b5e20" font-style="italic">i</text>
            </svg>
            <div class="it-header-logo-text">
                <span class="it-header-logo-infante">Infante</span>
                <span class="it-header-logo-sub">Alcaldía Municipio<br/>Autónomo</span>
                <span class="it-header-logo-bottom">Leonardo Infante</span>
            </div>
        </div>
        <div class="it-header-text">
            <div><strong>República Bolivariana de Venezuela</strong></div>
            <div><strong>Alcaldía del Municipio Autónomo Leonardo Infante</strong></div>
            <div><strong>Valle de la Pascua, Edo. Guárico</strong></div>
            <div><strong>Dirección de Informática y Sistemas</strong></div>
        </div>
    </header>
    <hr class="it-rule"/>
    <div class="it-date-row">
        <span>Valle de la Pascua: <strong>${esc(fechaCorta)}</strong></span>
    </div>
    <h1 class="it-title">INFORME TÉCNICO</h1>
    <div class="it-number">N° ${esc(val(data, 'numeroInforme', '—'))}</div>
    <div class="it-recipient">
        <div class="it-recipient-label">CIUDADANO:</div>
        <div>${esc(val(data, 'destinatarioNombre'))}</div>
        <div>${esc(val(data, 'destinatarioCargo'))}</div>
        <div>${esc(val(data, 'destinatarioDpto'))}</div>
    </div>
    <p class="it-greeting">Luego de extenderle un cordial saludo me dirijo a usted con la finalidad de dar a conocer el diagnóstico obtenido de la revisión de los siguientes equipos:</p>
    <table class="it-equipment">
        <thead>
            <tr>
                <th>Código del Bien</th>
                <th>Descripción</th>
                <th>Requerimiento</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${esc(val(data, 'codigoBien'))}</td>
                <td>${esc(val(data, 'descripcion')).replace(/\n/g, '<br/>')}</td>
                <td>${esc(val(data, 'requerimiento')).replace(/\n/g, '<br/>')}</td>
            </tr>
        </tbody>
    </table>
    ${componentRowsHtml}
    ${simpleDiagRow}
    <p class="it-closing">Sin más a que hacer referencia.</p>
    <table class="it-firmas">
        <thead>
            <tr>
                <th>${esc(val(data, 'firma1', 'INFORMATICA Y SISTEMA'))}</th>
                <th>${esc(val(data, 'firma2', 'DIVISION DE REGISTRO Y CONTROL DE BIENES'))}</th>
                <th>${esc(val(data, 'firma3', 'RECIBIDO POR:'))}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><div class="it-firma-line">FIRMA: _______________</div></td>
                <td><div class="it-firma-line">FIRMA: _______________</div></td>
                <td><div class="it-firma-line">FIRMA: _______________</div></td>
            </tr>
        </tbody>
    </table>
</article>`;
    },
};
