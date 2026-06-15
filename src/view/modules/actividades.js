import { safeInvoke } from '../ui/utils/ipc.js';
import { escapeHtml, escapeAttr } from '../ui/utils/escape.js';
import { iconBtn } from '../ui/utils/icons.js';
import { openCrearActividadModal, openEditarActividadModal, openDetalleActividadModal, tagEstado } from './actividad-modal.js';
import { refreshSelects } from './crud.js';

let currentLayout = 'cards';
let _onChange = null;

export function setOnChange(fn) {
    _onChange = fn;
}

export function getCurrentLayout() {
    return currentLayout;
}

export async function loadActividades() {
    const list = document.getElementById('actividades-list');
    const tableBody = document.querySelector('#actividades-list-table tbody');
    if (!list) return;

    const emptyCards = '<div class="empty-state"><p>No hay actividades registradas</p></div>';
    const emptyTable = '<tr><td colspan="5"><div class="empty-state"><p>No hay actividades registradas</p></div></td></tr>';

    try {
        const actividades = await safeInvoke('get-actividades');
        if (!actividades || actividades.length === 0) {
            list.innerHTML = emptyCards;
            if (tableBody) tableBody.innerHTML = emptyTable;
            return;
        }

        const cardsHtml = actividades.map(a => `
            <div class="crud-item rb-act" data-id="${a.id}"
                data-direccion="${encodeURIComponent(a.direccion)}"
                data-incidencia="${encodeURIComponent(a.incidencia)}"
                data-descripcion="${encodeURIComponent(a.descripcion || '')}"
                data-creado="${a.created_at}"
                data-dirid="${a.direccion_id}"
                data-incid="${a.incidencia_id}"
                data-estado="${a.estado}"
                data-prioridad="${a.prioridad || ''}">
                <div class="crud-info">
                    <span class="crud-name">${escapeHtml(a.direccion)}</span>
                    <span class="crud-meta">${escapeHtml(a.incidencia)} · ${escapeHtml(a.descripcion || 'Sin descripción')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${tagEstado(a.estado)}
                    <div class="crud-actions">
                        ${iconBtn('view', 'eye', 'Ver detalle')}
                        ${iconBtn('edit', 'pencil', 'Editar')}
                        ${iconBtn('export-pdf', 'pdf', 'Exportar PDF')}
                        ${iconBtn('export-word', 'word', 'Exportar Word')}
                        ${iconBtn('delete', 'trash', 'Eliminar')}
                    </div>
                </div>
            </div>
        `).join('');

        list.innerHTML = cardsHtml;

        if (tableBody) {
            tableBody.innerHTML = actividades.map(a => {
                const fecha = window.DateUtils?.parse(a.created_at);
                return `<tr class="rb-act" data-id="${a.id}"
                    data-direccion="${encodeURIComponent(a.direccion)}"
                    data-incidencia="${encodeURIComponent(a.incidencia)}"
                    data-descripcion="${encodeURIComponent(a.descripcion || '')}"
                    data-creado="${a.created_at}"
                    data-dirid="${a.direccion_id}"
                    data-incid="${a.incidencia_id}"
                    data-estado="${a.estado}"
                    data-prioridad="${a.prioridad || ''}">
                    <td class="cell-dir">${escapeHtml(a.direccion)}</td>
                    <td class="cell-meta">${escapeHtml(a.incidencia)}</td>
                    <td class="cell-meta">${escapeHtml(a.descripcion || '—')}</td>
                    <td class="cell-fecha">${fecha ? fecha.relative : a.created_at}</td>
                    <td class="crud-actions" style="white-space:nowrap;">
                        ${tagEstado(a.estado)}
                        ${iconBtn('view', 'eye', 'Ver detalle')}
                        ${iconBtn('edit', 'pencil', 'Editar')}
                        ${iconBtn('export-pdf', 'pdf', 'Exportar PDF')}
                        ${iconBtn('export-word', 'word', 'Exportar Word')}
                        ${iconBtn('delete', 'trash', 'Eliminar')}
                    </td>
                </tr>`;
            }).join('');
        }
    } catch (err) {
        console.error('Error cargando actividades:', err);
        list.innerHTML = emptyCards;
        if (tableBody) tableBody.innerHTML = emptyTable;
    }

    const cardsEl = document.getElementById('actividades-list');
    const tableEl = document.getElementById('actividades-list-table');
    const calEl = document.getElementById('calendar-view');
    if (cardsEl) cardsEl.style.display = currentLayout === 'cards' ? '' : 'none';
    if (tableEl) tableEl.style.display = currentLayout === 'list' ? '' : 'none';
    if (calEl) calEl.style.display = currentLayout === 'calendar' ? '' : 'none';
}

export function getActividadFromElement(item) {
    return {
        id: item.dataset.id,
        direccion: decodeURIComponent(item.dataset.direccion || ''),
        incidencia: decodeURIComponent(item.dataset.incidencia || ''),
        descripcion: decodeURIComponent(item.dataset.descripcion || ''),
        created_at: item.dataset.creado || '',
        direccion_id: item.dataset.dirid || '',
        incidencia_id: item.dataset.incid || '',
        estado: item.dataset.estado || 'completado',
        prioridad: item.dataset.prioridad || '',
    };
}

export async function handleActividadAction(e, refresh) {
    const btn = e.target.closest('.icon-btn, .cal-btn');
    if (!btn) return;
    const item = btn.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;
    const action = btn.dataset.action;
    const actividad = getActividadFromElement(item);

    if (action === 'view') return openDetalleActividadModal(actividad);
    if (action === 'edit') return openEditarActividadModal(actividad, refresh);
    if (action === 'delete') {
        if (!confirm('¿Eliminar esta actividad?')) return;
        try {
            await safeInvoke('delete-actividad', id);
            Toast.success(Toast.MESSAGES.ACTIVIDAD_ELIMINADA);
            if (typeof refresh === 'function') await refresh();
        } catch (err) {
            console.error('Error eliminando:', err);
            Toast.error(Toast.MESSAGES.ACTIVIDAD_DELETE_ERROR);
        }
        return;
    }
    if (action === 'export-pdf' || action === 'export-word') {
        Toast.info?.(`Generando ${action === 'export-pdf' ? 'PDF' : 'Word'}...`);
        try {
            const fn = action === 'export-pdf' ? window.electronAPI.export.pdf : window.electronAPI.export.word;
            const result = await fn({ actividades: [actividad], filterLabel: `${actividad.direccion} — ${actividad.incidencia}` });
            if (result?.filePath) Toast.success('Reporte guardado correctamente');
        } catch (err) {
            console.error(`Error exportando ${action}:`, err);
            Toast.error('Error al exportar');
        }
    }
}

export function initActividades() {
    const list = document.getElementById('actividades-list');
    const table = document.getElementById('actividades-list-table');
    const calendar = document.getElementById('calendar-view');

    if (list) list.addEventListener('click', async (e) => handleActividadAction(e, _refresh));
    if (table) table.addEventListener('click', async (e) => handleActividadAction(e, _refresh));
    if (calendar) {
        calendar.addEventListener('actividad-action', async (e) => {
            const detail = e.detail || {};
            const fakeItem = {
                dataset: {
                    id: detail.id,
                    direccion: encodeURIComponent(detail.direccion || ''),
                    incidencia: encodeURIComponent(detail.incidencia || ''),
                    descripcion: encodeURIComponent(detail.descripcion || ''),
                    creado: detail.creado || '',
                    dirid: detail.dirid || '',
                    incid: detail.incid || '',
                    estado: detail.estado || 'completado',
                },
            };
            const fakeEvent = { target: { closest: (sel) => sel === '.icon-btn, .cal-btn' ? { dataset: { action: detail.action } } : sel === '[data-id]' ? fakeItem : null } };
            await handleActividadAction(fakeEvent, _refresh);
        });
    }

    document.getElementById('btn-crear-actividad')?.addEventListener('action', async () => {
        openCrearActividadModal(_refresh);
    });

    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLayout = btn.dataset.layout;
            loadActividades();
            if (currentLayout === 'calendar') {
                const cal = document.getElementById('calendar-view');
                if (cal) cal.load(new Date().getFullYear(), new Date().getMonth() + 1);
            }
        });
    });

    return loadActividades;
}

async function _refresh() {
    await loadActividades();
    if (typeof _onChange === 'function') await _onChange();
}
