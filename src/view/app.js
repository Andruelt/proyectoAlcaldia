'use strict';

console.log('[DEBUG] Inline script started');
console.log('[DEBUG] electronAPI available:', !!window.electronAPI);

window.addEventListener('error', (e) => {
    console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[UNHANDLED REJECTION]', e.reason);
});

const MSG = window.Toast ? window.Toast.MESSAGES : {};

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function safeInvoke(channel, data) {
    if (!window.electronAPI) {
        throw new Error('electronAPI no disponible. Verifique que el preload script se cargó correctamente.');
    }
    console.log(`[IPC] invoke ${channel}`, data);
    const result = await window.electronAPI.invoke(channel, data);
    console.log(`[IPC] result ${channel}:`, result);
    return result;
}

async function loadDirecciones() {
    const list = document.getElementById('direcciones-list');
    if (!list) return;
    
    try {
        const direcciones = await safeInvoke('get-direcciones');
        
        if (!direcciones || direcciones.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No hay direcciones registradas</p></div>';
            return;
        }
        
        list.innerHTML = `
            <div class="crud-counter">Mostrando ${direcciones.length} direcciones</div>
            ${direcciones.map(d => `
                <div class="crud-item" data-id="${d.id}" data-nombre="${encodeURIComponent(d.nombre)}">
                    <span class="crud-name">${escapeHtml(d.nombre)}</span>
                    <div class="crud-edit-inline">
                        <input type="text" class="crud-edit-input" value="${escapeHtml(d.nombre)}">
                        <button class="crud-btn save" data-action="save">Guardar</button>
                        <button class="crud-btn cancel" data-action="cancel">Cancelar</button>
                    </div>
                    <div class="crud-actions">
                        <button class="crud-btn edit" data-action="edit">Editar</button>
                        <button class="crud-btn delete" data-action="delete">Eliminar</button>
                    </div>
                </div>
            `).join('')}`;
    } catch (err) {
        console.error('Error cargando direcciones:', err);
        list.innerHTML = '<div class="empty-state"><p>Error al cargar direcciones</p></div>';
    }
}

async function loadIncidencias() {
    const list = document.getElementById('incidencias-list');
    if (!list) return;
    
    try {
        const incidencias = await safeInvoke('get-incidencias');
        
        if (!incidencias || incidencias.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No hay incidencias registradas</p></div>';
            return;
        }
        
        list.innerHTML = `
            <div class="crud-counter">Mostrando ${incidencias.length} incidencias</div>
            ${incidencias.map(i => `
                <div class="crud-item" data-id="${i.id}" data-nombre="${encodeURIComponent(i.nombre)}">
                    <span class="crud-name">${escapeHtml(i.nombre)}</span>
                    <div class="crud-edit-inline">
                        <input type="text" class="crud-edit-input" value="${escapeHtml(i.nombre)}">
                        <button class="crud-btn save" data-action="save">Guardar</button>
                        <button class="crud-btn cancel" data-action="cancel">Cancelar</button>
                    </div>
                    <div class="crud-actions">
                        <button class="crud-btn edit" data-action="edit">Editar</button>
                        <button class="crud-btn delete" data-action="delete">Eliminar</button>
                    </div>
                </div>
            `).join('')}`;
    } catch (err) {
        console.error('Error cargando incidencias:', err);
        list.innerHTML = '<div class="empty-state"><p>Error al cargar incidencias</p></div>';
    }
}

let currentLayout = 'cards';

async function loadActividades() {
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

        const iconBtn = (action, icon, tooltip) =>
            `<tool-tip text="${tooltip}"><button class="icon-btn ${action}" data-action="${action}">${icon}</button></tool-tip>`;

        const eyeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
        const pencilSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
        const trashSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        const pdfSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/></svg>';
        const wordSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';

        list.innerHTML = actividades.map(a => `
            <div class="crud-item" data-id="${a.id}" data-direccion="${encodeURIComponent(a.direccion)}" data-incidencia="${encodeURIComponent(a.incidencia)}" data-descripcion="${encodeURIComponent(a.descripcion || '')}" data-creado="${a.created_at}" data-dirid="${a.direccion_id}" data-incid="${a.incidencia_id}" data-estado="${a.estado}">
                <div class="crud-info">
                    <span class="crud-name">${escapeHtml(a.direccion)}</span>
                    <span class="crud-meta">${escapeHtml(a.incidencia)} &middot; ${escapeHtml(a.descripcion || 'Sin descripción')}</span>
                </div>
                <div class="crud-actions">
                    ${iconBtn('view', eyeSvg, 'Ver detalle')}
                    ${iconBtn('edit', pencilSvg, 'Editar')}
                    ${iconBtn('export-pdf', pdfSvg, 'Exportar PDF')}
                    ${iconBtn('export-word', wordSvg, 'Exportar Word')}
                    ${iconBtn('delete', trashSvg, 'Eliminar')}
                </div>
            </div>
        `).join('');

        if (tableBody) {
            const iconBtnTd = (action, icon, tooltip) =>
                `<tool-tip text="${tooltip}"><button class="icon-btn ${action}" data-action="${action}">${icon}</button></tool-tip>`;

            tableBody.innerHTML = actividades.map(a => {
                const fecha = window.DateUtils?.parse(a.created_at);
                return `<tr data-id="${a.id}" data-direccion="${encodeURIComponent(a.direccion)}" data-incidencia="${encodeURIComponent(a.incidencia)}" data-descripcion="${encodeURIComponent(a.descripcion || '')}" data-creado="${a.created_at}" data-dirid="${a.direccion_id}" data-incid="${a.incidencia_id}" data-estado="${a.estado}">
                    <td class="cell-dir">${escapeHtml(a.direccion)}</td>
                    <td class="cell-meta">${escapeHtml(a.incidencia)}</td>
                    <td class="cell-meta">${escapeHtml(a.descripcion || '—')}</td>
                    <td class="cell-fecha">${fecha ? fecha.relative : a.created_at}</td>
                    <td class="crud-actions" style="white-space:nowrap;">
                        ${iconBtnTd('view', eyeSvg, 'Ver detalle')}
                        ${iconBtnTd('edit', pencilSvg, 'Editar')}
                        ${iconBtnTd('export-pdf', pdfSvg, 'Exportar PDF')}
                        ${iconBtnTd('export-word', wordSvg, 'Exportar Word')}
                        ${iconBtnTd('delete', trashSvg, 'Eliminar')}
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

async function handleActividadClick(e) {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const item = btn.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;

    if (btn.dataset.action === 'view') {
        const direccion = decodeURIComponent(item.dataset.direccion || '');
        const incidencia = decodeURIComponent(item.dataset.incidencia || '');
        const descripcion = decodeURIComponent(item.dataset.descripcion || '');
        const creado = item.dataset.creado || '';
        const fecha = window.DateUtils?.parse(creado);
        ModalDialog.open('Detalle de Actividad', `
            <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:${window.getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569'};margin-bottom:4px;">Dirección</div>
                    <div style="font-weight:600;color:#0f172a;">${escapeHtml(direccion)}</div>
                </div>
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:#475569;margin-bottom:4px;">Incidencia</div>
                    <div style="font-weight:600;color:#0f172a;">${escapeHtml(incidencia)}</div>
                </div>
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:#475569;margin-bottom:4px;">Descripción</div>
                    <div style="color:#0f172a;white-space:pre-wrap;">${escapeHtml(descripcion || 'Sin descripción')}</div>
                </div>
                <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:12px;color:#94a3b8;">
                    Creado ${fecha ? fecha.relative : ''} &middot; ${fecha ? fecha.human : creado}
                </div>
            </div>
        `);
    }

    if (btn.dataset.action === 'edit') {
        const dirId = item.dataset.dirid || '';
        const incId = item.dataset.incid || '';
        const desc = decodeURIComponent(item.dataset.descripcion || '');
        const currentEstado = item.dataset.estado || 'completado';
        const estadoLabels = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', cancelado: 'Cancelado' };
        ModalDialog.open('Editar Actividad', `
            <style>
                .toggle-wrap { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-secondary); cursor:pointer; user-select:none; }
                .toggle-wrap input[type="checkbox"] { appearance:none; width:36px; height:20px; background:#cbd5e1; border-radius:999px; position:relative; cursor:pointer; transition:background 0.2s; flex-shrink:0; }
                .toggle-wrap input[type="checkbox"]:checked { background:var(--accent-color); }
                .toggle-wrap input[type="checkbox"]::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.2s; }
                .toggle-wrap input[type="checkbox"]:checked::after { transform:translateX(16px); }
            </style>
            <form id="edit-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
                <select-dropdown id="edit-dirid" label="Dirección"></select-dropdown>
                <select-dropdown id="edit-incid" label="Incidencia"></select-dropdown>
                <form-textarea id="edit-desc" label="Descripción">${escapeHtml(desc)}</form-textarea>
                <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;">Estado actual: <span class="tag ${currentEstado === 'completado' ? 'tag-completado' : currentEstado === 'en_proceso' ? 'tag-en_proceso' : 'tag-pendiente'}">${estadoLabels[currentEstado] || currentEstado}</span></div>
                <label class="toggle-wrap">
                    <input type="checkbox" id="edit-toggle-estado">
                    <span>Cambiar estado</span>
                </label>
                <select-dropdown id="edit-estado" label="Estado" style="display:none;"></select-dropdown>
                <button-primary text="GUARDAR CAMBIOS"></button-primary>
            </form>
        `);
        const editModal = ModalDialog.getInstance();
        const root = editModal.shadowRoot;
        const form = root.querySelector('#edit-actividad-form');
        if (form) {
            const dirSelect = root.querySelector('#edit-dirid');
            const incSelect = root.querySelector('#edit-incid');
            const descTextarea = root.querySelector('#edit-desc');
            const estadoSelect = root.querySelector('#edit-estado');
            const toggle = root.querySelector('#edit-toggle-estado');
            const dirs = await safeInvoke('get-direcciones');
            const incs = await safeInvoke('get-incidencias');
            if (dirSelect) {
                dirSelect.loadOptions(dirs, 'Seleccione dirección');
                dirSelect.value = dirId;
            }
            if (incSelect) {
                incSelect.loadOptions(incs, 'Seleccione incidencia');
                incSelect.value = incId;
            }
            if (descTextarea && desc) descTextarea.value = desc;
            if (estadoSelect) {
                estadoSelect.loadOptions(
                    [{ id: 'pendiente', nombre: 'Pendiente' }, { id: 'en_proceso', nombre: 'En proceso' }, { id: 'completado', nombre: 'Completado' }],
                    'Seleccione estado'
                );
                estadoSelect.value = currentEstado;
            }
            if (toggle && estadoSelect) {
                toggle.addEventListener('change', () => {
                    estadoSelect.style.display = toggle.checked ? 'block' : 'none';
                });
            }
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const newDirId = dirSelect?.value || '';
                const newIncId = incSelect?.value || '';
                const newDesc = descTextarea?.value || '';
                if (!newDirId || !newIncId) {
                    Toast.error(MSG.ACTIVIDAD_SIN_SELECCION);
                    return;
                }
                try {
                    await safeInvoke('update-actividad', { id, direccionId: newDirId, incidenciaId: newIncId, descripcion: newDesc });
                    if (toggle?.checked && estadoSelect?.value && estadoSelect.value !== currentEstado) {
                        await safeInvoke('update-actividad-estado', { id, estado: estadoSelect.value });
                    }
                    Toast.success('Actividad actualizada');
                    ModalDialog.close();
                    await loadActividades();
                } catch (err) {
                    console.error('Error editando actividad:', err);
                    Toast.error('Error al editar actividad');
                }
            });
        }
    }

    if (btn.dataset.action === 'delete') deleteActividad(id);

    if (btn.dataset.action === 'export-pdf' || btn.dataset.action === 'export-word') {
        const actividad = {
            id,
            direccion: decodeURIComponent(item.dataset.direccion || ''),
            incidencia: decodeURIComponent(item.dataset.incidencia || ''),
            descripcion: decodeURIComponent(item.dataset.descripcion || ''),
            created_at: item.dataset.creado || ''
        };
        const filterLabel = `${actividad.direccion} — ${actividad.incidencia}`;
        Toast.info?.(`Generando ${btn.dataset.action === 'export-pdf' ? 'PDF' : 'Word'}...`);
        try {
            const fn = btn.dataset.action === 'export-pdf' ? window.electronAPI.export.pdf : window.electronAPI.export.word;
            const result = await fn({ actividades: [actividad], filterLabel });
            if (result.filePath) Toast.success(`Reporte guardado correctamente`);
        } catch (err) {
            console.error(`Error exportando ${btn.dataset.action}:`, err);
            Toast.error?.(`Error al exportar`);
        }
    }
}

async function loadSelects() {
    const warningEl = document.getElementById('actividad-warning');
    const btnCrear = document.getElementById('btn-crear-actividad');
    
    let hasDirs = false;
    let hasIncs = false;
    
    try {
        const dirs = await safeInvoke('get-direcciones');
        const incs = await safeInvoke('get-incidencias');
        hasDirs = dirs && dirs.length > 0;
        hasIncs = incs && incs.length > 0;
    } catch (err) {
        console.error('Error cargando selects:', err);
    }
    
    const canCreate = hasDirs && hasIncs;
    if (warningEl) warningEl.style.display = canCreate ? 'none' : 'block';
    if (btnCrear) btnCrear.disabled = !canCreate;
}

async function deleteDireccion(id) {
    try {
        if (confirm('¿Eliminar esta dirección?')) {
            await safeInvoke('delete-direccion', id);
            Toast.success(MSG.DIRECCION_ELIMINADA);
            await loadDirecciones();
            await loadSelects();
        }
    } catch (err) {
        console.error('Error eliminando dirección:', err);
        Toast.error(MSG.DIRECCION_DELETE_ERROR);
    }
}

async function deleteIncidencia(id) {
    try {
        if (confirm('¿Eliminar esta incidencia?')) {
            await safeInvoke('delete-incidencia', id);
            Toast.success(MSG.INCIDENCIA_ELIMINADA);
            await loadIncidencias();
            await loadSelects();
        }
    } catch (err) {
        console.error('Error eliminando incidencia:', err);
        Toast.error(MSG.INCIDENCIA_DELETE_ERROR);
    }
}

    async function deleteActividad(id) {
    try {
        if (confirm('¿Eliminar esta actividad?')) {
            await safeInvoke('delete-actividad', id);
            Toast.success(MSG.ACTIVIDAD_ELIMINADA);
            await loadActividades();
            const cal = document.getElementById('calendar-view');
            if (cal && currentLayout === 'calendar') cal.load(cal._year, cal._month);
        }
    } catch (err) {
        console.error('Error eliminando actividad:', err);
        Toast.error(MSG.ACTIVIDAD_DELETE_ERROR);
    }
}

function _calcPeriodo(periodo, inicio, fin) {
    const now = new Date();
    if (periodo === 'rango' && inicio && fin) {
        return { fechaInicio: inicio, fechaFin: fin };
    } else if (periodo === 'semanal') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return {
            fechaInicio: new Date(now.setDate(diff)).toISOString().split('T')[0],
            fechaFin: new Date(now.setDate(diff + 7)).toISOString().split('T')[0]
        };
    } else if (periodo === 'mensual') {
        return {
            fechaInicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            fechaFin: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
        };
    } else if (periodo === 'anual') {
        return {
            fechaInicio: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
            fechaFin: new Date(now.getFullYear() + 1, 0, 1).toISOString().split('T')[0]
        };
    }
    return { fechaInicio: null, fechaFin: null };
}

async function loadKPIs(fechaInicio, fechaFin) {
    try {
        const kpis = await safeInvoke('get-kpis', { inicio: fechaInicio, fin: fechaFin });

        const fmt = (h) => h < 24 ? `${h}h` : `${(h / 24).toFixed(1)}d`;
        const trendArrow = (pct) => {
            if (pct === 0) return '→ 0%';
            return pct > 0 ? `▲ +${pct}%` : `▼ ${pct}%`;
        };

        const setCard = (id, value, trend) => {
            const el = document.getElementById(id);
            if (el) { el.setAttribute('value', value); if (trend !== undefined) el.setAttribute('trend', trend); }
        };

        setCard('kpi-total', String(kpis.totalPeriodo), `${trendArrow(kpis.trendPercent)} vs período anterior`);
        setCard('kpi-tiempo', kpis.tiempoPromedioHoras > 0 ? fmt(kpis.tiempoPromedioHoras) : '—', kpis.tiempoPromedioHoras > 0 ? `${trendArrow(kpis.trendTiempoPercent)} vs período anterior` : 'Sin datos');
        setCard('kpi-pendientes', String(kpis.pendientes));
    } catch (err) {
        console.error('Error cargando KPIs:', err);
    }
}

// ─── Tabla avanzada del Dashboard (F3) ─────────────────────────────────────

function _tagEstado(estado) {
    const map = { completado: ['Completado', 'tag-completado'], en_proceso: ['En proceso', 'tag-en_proceso'], pendiente: ['Pendiente', 'tag-pendiente'], cancelado: ['Cancelado', 'tag-cancelado'] };
    const [label, cls] = map[estado] || [estado, 'tag-estado'];
    return `<span class="tag ${cls}">${label}</span>`;
}
function _tagPrioridad(prioridad) {
    const map = { baja: ['Baja', 'tag-baja'], media: ['Media', 'tag-media'], alta: ['Alta', 'tag-alta'], critica: ['Crítica', 'tag-critica'] };
    const [label, cls] = map[prioridad] || [prioridad, 'tag-prioridad'];
    return `<span class="tag ${cls}">${label}</span>`;
}
function _fmtFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const fecha = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${fecha}, ${hora}`;
}

async function mostrarDetalleActividad(id) {
    try {
        const { actividad, logs } = await safeInvoke('get-actividad-con-log', id);
        if (!actividad) { Toast.error?.('Actividad no encontrada'); return; }

        const historial = logs && logs.length > 0 ? logs.map(l =>
            `<div style="font-size:11px;color:var(--text-tertiary);padding:4px 0;border-bottom:1px solid var(--border-color);">
                <span style="font-weight:500;color:var(--text-secondary);">${escapeHtml(l.campo)}</span>:
                ${escapeHtml(l.valor_anterior || '—')} → ${escapeHtml(l.valor_nuevo)}
                <span style="float:right;">${new Date(l.created_at).toLocaleString('es-ES')}</span>
            </div>`
        ).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">Sin cambios registrados</div>';

        const modalContent = `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Dirección</div><div style="font-weight:600;font-size:13px;">${escapeHtml(actividad.direccion)}</div></div>
                    <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Incidencia</div><div style="font-weight:600;font-size:13px;">${escapeHtml(actividad.incidencia)}</div></div>
                    <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Prioridad</div><div>${_tagPrioridad(actividad.prioridad)}</div></div>
                    <div><div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Estado</div><div>${_tagEstado(actividad.estado)}</div></div>
                </div>
                <div>
                    <div style="font-size:10px;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Descripción</div>
                    <div style="font-size:13px;color:var(--text-primary);white-space:pre-wrap;">${escapeHtml(actividad.descripcion || 'Sin descripción')}</div>
                </div>
                <div style="font-size:11px;color:var(--text-tertiary);border-top:1px solid var(--border-color);padding-top:8px;">
                    Creado: ${_fmtFecha(actividad.created_at)}
                    ${actividad.resolved_at ? `<br>Resuelto: ${_fmtFecha(actividad.resolved_at)}` : ''}
                </div>
                <div style="border-top:1px solid var(--border-color);padding-top:8px;">
                    <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Historial de cambios</div>
                    ${historial}
                </div>
            </div>`;
        ModalDialog.open('Detalle de Actividad', modalContent);
    } catch (err) {
        console.error('Error cargando detalle:', err);
        Toast.error?.('Error al cargar detalle');
    }
}

async function loadDashboard(periodo = 'mensual', inicio = null, fin = null) {
    try {
        const { fechaInicio, fechaFin } = _calcPeriodo(periodo, inicio, fin);
        if (!fechaInicio || !fechaFin) return;

        await Promise.all([
            loadKPIs(fechaInicio, fechaFin),
            loadCharts(fechaInicio, fechaFin),
        ]);
    } catch (err) {
        console.error('Error cargando dashboard:', err);
    }
}

// ─── Charts (SVG puro, sin dependencias) ──────────────────────────────────

const _chartCache = { porDir: [], tendencia: [] };

function _renderBarChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (data) _chartCache.porDir = data;
    else data = _chartCache.porDir;
    if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state"><p>Sin datos</p></div>'; return; }

    const labelWidth = 130;
    const max = Math.max(...data.map(d => d.cantidad), 1);
    const barH = 20, gap = 6;
    const h = data.length * (barH + gap) + 10;
    const w = 560, rightW = 36, innerW = w - labelWidth - rightW;

    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="max-height:${h+4}px;">
        ${data.map((d, i) => {
            const y = i * (barH + gap) + 4;
            const bw = Math.max((d.cantidad / max) * innerW, d.cantidad > 0 ? 12 : 0);
            const hue = (i * 47) % 360;
            return `
                <text x="${labelWidth - 6}" y="${y + barH - 5}" text-anchor="end" font-size="10" fill="var(--text-secondary)">${escapeHtml(d.nombre)}</text>
                <rect x="${labelWidth}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="hsl(${hue},45%,55%)" opacity="0.85"/>
                <text x="${labelWidth + bw + 4}" y="${y + barH - 5}" font-size="10" font-weight="600" fill="var(--text-primary)">${d.cantidad}</text>`;
        }).join('')}
    </svg>`;
}

function _renderLineChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (data) _chartCache.tendencia = data;
    else data = _chartCache.tendencia;
    if (!data || data.length < 2) { el.innerHTML = '<div class="empty-state"><p>Sin datos suficientes</p></div>'; return; }

    const sorted = [...data].reverse();
    const max = Math.max(...sorted.map(d => d.cantidad), 1);
    const w = 560, h = 160;
    const pad = { top: 16, right: 12, bottom: 28, left: 36 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const n = sorted.length;

    const pts = sorted.map((d, i) => ({
        x: pad.left + (i / (n - 1)) * plotW,
        y: pad.top + plotH - (d.cantidad / max) * plotH,
        val: d.cantidad, label: d.semana
    }));

    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${pad.top + plotH} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[n-1].x},${pad.top + plotH}`;

    const yTicks = 4;
    const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round((max / yTicks) * i);
        const y = pad.top + plotH - (val / max) * plotH;
        return `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="var(--border-color)" stroke-width="1"/>
            <text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--text-tertiary)">${val}</text>`;
    }).join('');

    const xLabels = pts.map((p, i) => {
        if (i % Math.ceil(n / 6) !== 0 && i !== n - 1) return '';
        return `<text x="${p.x}" y="${h - 4}" text-anchor="middle" font-size="8" fill="var(--text-tertiary)">${p.label.replace('W', 'S')}</text>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="max-height:${h+4}px;">
        ${yLines}
        <polygon points="${area}" fill="var(--accent-color)" opacity="0.08"/>
        <polyline points="${line}" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--accent-color)"/>`).join('')}
        ${xLabels}
    </svg>`;
}

async function loadCharts(fechaInicio, fechaFin) {
    try {
        const [porDir, tendencia] = await Promise.all([
            safeInvoke('get-actividades-por-direccion-stats', { inicio: fechaInicio, fin: fechaFin }),
            safeInvoke('get-tendencia', 12),
        ]);
        _renderBarChart('chart-direcciones', porDir);
        _renderLineChart('chart-tendencia', tendencia);
    } catch (err) {
        console.error('Error cargando charts:', err);
    }
}

async function loadAnalytics(periodo = 'trimestral') {
    const container = document.getElementById('dashboard-analytics');
    const titleEl = document.querySelector('#view-inicio h3');
    if (!container) return;

    const now = new Date();
    let fechaInicio, periodoLabel;
    if (periodo === 'trimestral') {
        fechaInicio = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
        periodoLabel = 'Trimestrales';
    } else if (periodo === 'semestral') {
        fechaInicio = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        periodoLabel = 'Semestrales';
    } else {
        fechaInicio = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
        periodoLabel = 'Anuales';
    }

    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const iniM = meses[new Date(fechaInicio).getMonth()];
    const iniY = new Date(fechaInicio).getFullYear().toString().slice(-2);
    const finM = meses[now.getMonth()];
    const finY = now.getFullYear().toString().slice(-2);
    const rangoStr = `${iniM} ${iniY} - ${finM} ${finY}`;
    const newTitle = `Analíticas ${periodoLabel} (${rangoStr})`;

    const ensureKeyframes = () => {
        if (document.getElementById('analytics-animations')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'analytics-animations';
        styleEl.textContent = `
            @keyframes analyticsFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes analyticsRow { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        `;
        document.head.appendChild(styleEl);
    };

    const hadContent = container.children.length > 0 && !container.querySelector('.empty-state');

    if (hadContent) {
        container.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-4px)';
        if (titleEl) {
            titleEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            titleEl.style.opacity = '0';
            titleEl.style.transform = 'translateY(-4px)';
        }
        await new Promise((r) => setTimeout(r, 180));
    }

    if (titleEl) {
        titleEl.textContent = newTitle;
        titleEl.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
        titleEl.style.opacity = '1';
        titleEl.style.transform = 'translateY(0)';
    }

    try {
        const data = await safeInvoke('get-analytics', fechaInicio);
        const total = data.reduce((s, r) => s + r.cantidad, 0);

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay datos para este período</p></div>';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
            return;
        }

        ensureKeyframes();
        const max = Math.max(...data.map(r => r.cantidad), 1);

        container.innerHTML = `
            <div class="analytics-meta" style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px;">${rangoStr} — ${total} actividad${total !== 1 ? 'es' : ''}</div>
            ${data.map((r, i) => {
                const pct = (r.cantidad / max * 100).toFixed(0);
                const hue = (i * 47) % 360;
                const isWide = parseInt(pct) >= 85;
                const rowDelay = (0.05 + i * 0.06).toFixed(2);
                const barDelay = (0.15 + i * 0.06).toFixed(2);
                return `<div class="analytics-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                    <span style="width:160px;font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.incidencia)}</span>
                    <div style="flex:1;height:22px;background:var(--bg-secondary);border-radius:6px;overflow:hidden;position:relative;">
                        <div class="analytics-bar" data-pct="${pct}" style="height:100%;width:0%;background:hsl(${hue},40%,50%);border-radius:6px;transition:width 0.7s cubic-bezier(0.16,1,0.3,1) ${barDelay}s;"></div>
                        ${isWide
                            ? `<span class="analytics-count" style="position:absolute;top:0;right:8px;font-size:10px;font-weight:700;color:#ffffff;line-height:22px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${r.cantidad}</span>`
                            : `<span class="analytics-count" style="position:absolute;top:0;left:${pct}%;font-size:10px;font-weight:600;color:var(--text-primary);line-height:22px;margin-left:6px;white-space:nowrap;">${r.cantidad}</span>`
                        }
                    </div>
                </div>`;
            }).join('')}
        `;

        container.querySelectorAll('.analytics-row').forEach((row, i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-8px)';
            row.style.animation = `analyticsRow 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + i * 0.06}s forwards`;
        });

        container.querySelectorAll('.analytics-count').forEach((el, i) => {
            el.style.opacity = '0';
            el.style.animation = `analyticsFade 0.3s ease ${0.4 + i * 0.06}s forwards`;
        });

        const meta = container.querySelector('.analytics-meta');
        if (meta) {
            meta.style.opacity = '0';
            meta.style.animation = 'analyticsFade 0.3s ease forwards';
        }

        requestAnimationFrame(() => {
            container.querySelectorAll('.analytics-bar').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        });

        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    } catch (err) {
        console.error('Error cargando analytics:', err);
        container.innerHTML = '<div class="empty-state"><p>Error al cargar analytics</p></div>';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }
}

async function loadInforme(filtroDireccionId) {
    const table = document.getElementById('informe-table');
    if (!table) return;

    try {
        const actividades = await safeInvoke('get-actividades-por-direccion', filtroDireccionId || '');

        if (!actividades || actividades.length === 0) {
            table.innerHTML = '<div class="empty-state"><p>No hay actividades para mostrar</p></div>';
            return;
        }

        table.innerHTML = `
            <table class="informe-table">
                <thead>
                    <tr>
                        <th>Dirección</th>
                        <th>Incidencia</th>
                        <th>Descripción</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${actividades.map(a => {
                        const fecha = window.DateUtils?.parse(a.created_at);
                        return `<tr>
                            <td>${escapeHtml(a.direccion)}</td>
                            <td>${escapeHtml(a.incidencia)}</td>
                            <td>${escapeHtml(a.descripcion || '—')}</td>
                            <td>${fecha ? fecha.short : a.created_at}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
    } catch (err) {
        console.error('Error cargando informe:', err);
        table.innerHTML = '<div class="empty-state"><p>Error al cargar informe</p></div>';
    }
}

async function initInformeFilters() {
    const filterSelect = document.querySelector('#view-informe select-dropdown[id="filter-direccion"]');
    if (!filterSelect) return;
    try {
        const dirs = await safeInvoke('get-direcciones');
        filterSelect.loadOptions([{ id: '', nombre: 'Todas las direcciones' }, ...dirs], 'Seleccione dirección');
        filterSelect.addEventListener('change', (e) => {
            loadInforme(e.detail.value || undefined);
        });
    } catch (err) {
        console.error('Error cargando filtros de informe:', err);
    }
}

let _analyticsPeriodo = 'trimestral';

function initAnalyticsButtons() {
    const toggle = (id, periodo) => {
        document.querySelectorAll('[id^="btn-analytics-"]').forEach(b => b.setAttribute('variant', 'secondary'));
        const btn = document.getElementById(id);
        if (btn) btn.setAttribute('variant', 'primary');
        _analyticsPeriodo = periodo;
        loadAnalytics(periodo);
    };
    document.getElementById('btn-analytics-trimestral')?.addEventListener('action', () => toggle('btn-analytics-trimestral', 'trimestral'));
    document.getElementById('btn-analytics-semestral')?.addEventListener('action', () => toggle('btn-analytics-semestral', 'semestral'));
    document.getElementById('btn-analytics-anual')?.addEventListener('action', () => toggle('btn-analytics-anual', 'anual'));

    const btnRefresh = document.getElementById('btn-refresh-analytics');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            loadAnalytics(_analyticsPeriodo);
            const svg = btnRefresh.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(360deg)';
                svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                svg.style.transformOrigin = '50% 50%';
                setTimeout(() => { svg.style.transform = ''; svg.style.transition = ''; }, 600);
            }
        });
    }
}

function initDashboardFilters() {
    const periodoSelect = document.querySelector('#dashboard-periodo');
    const rangoFechas = document.getElementById('rango-fechas');
    const btnAplicar = document.getElementById('btn-aplicar-rango');
    const inputInicio = document.getElementById('rango-inicio');
    const inputFin = document.getElementById('rango-fin');

    if (!periodoSelect) return;

    if (periodoSelect) {
        periodoSelect.addEventListener('change', (e) => {
            const periodo = e.detail.value;
            if (periodo === 'rango') {
                rangoFechas.style.display = 'flex';
            } else {
                rangoFechas.style.display = 'none';
                loadDashboard(periodo);
            }
        });
    }

    if (btnAplicar) {
        btnAplicar.addEventListener('action', () => {
            const inicio = inputInicio?.value;
            const fin = inputFin?.value;
            if (inicio && fin) {
                loadDashboard('rango', inicio, fin);
            }
        });
    }

    const btnRefresh = document.getElementById('btn-refresh-dashboard');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const periodo = periodoSelect.value || 'mensual';
            if (periodo === 'rango') {
                const inicio = inputInicio?.value;
                const fin = inputFin?.value;
                if (inicio && fin) loadDashboard('rango', inicio, fin);
                else loadDashboard('mensual');
            } else {
                loadDashboard(periodo);
            }
            const svg = btnRefresh.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(360deg)';
                svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                svg.style.transformOrigin = '50% 50%';
                setTimeout(() => { svg.style.transform = ''; svg.style.transition = ''; }, 600);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded fired');
    
    try {
    loadDashboard();
    loadAnalytics();
    loadDirecciones();
    loadIncidencias();
    loadActividades();
    loadSelects();
    initInformeFilters();
    initDashboardFilters();
    initAnalyticsButtons();
    } catch (err) {
        console.error('[DEBUG] Error in initial load:', err);
    }
    
    document.getElementById('direcciones-list').addEventListener('click', async (e) => {
        const btn = e.target.closest('.crud-btn');
        if (!btn) return;
        const item = btn.closest('.crud-item');
        const id = item?.dataset.id;
        const action = btn.dataset.action;
        
        if (action === 'edit') {
            item.classList.add('editing');
            item.querySelector('.crud-edit-inline').classList.add('active');
            const input = item.querySelector('.crud-edit-input');
            input.focus();
            input.select();
            input.onkeyup = (ev) => {
                if (ev.key === 'Enter') item.querySelector('.crud-btn.save').click();
                if (ev.key === 'Escape') item.querySelector('.crud-btn.cancel').click();
            };
        }
        
        if (action === 'save') {
            const input = item.querySelector('.crud-edit-input');
            const nuevoNombre = input?.value.trim();
            if (!nuevoNombre) return;
            try {
                await safeInvoke('update-direccion', { id, nombre: nuevoNombre });
                Toast.success(MSG.DIRECCION_ACTUALIZADA);
                await loadDirecciones();
                await loadSelects();
            } catch (err) {
                console.error('Error editando dirección:', err);
                Toast.error(MSG.DIRECCION_EDIT_ERROR);
            }
        }
        
        if (action === 'cancel') {
            item.classList.remove('editing');
            item.querySelector('.crud-edit-inline').classList.remove('active');
            const nombre = decodeURIComponent(item.dataset.nombre || '');
            item.querySelector('.crud-edit-input').value = nombre;
        }
        
        if (action === 'delete') deleteDireccion(id);
    });
    
    document.getElementById('incidencias-list').addEventListener('click', async (e) => {
        const btn = e.target.closest('.crud-btn');
        if (!btn) return;
        const item = btn.closest('.crud-item');
        const id = item?.dataset.id;
        const action = btn.dataset.action;

        if (action === 'edit') {
            item.classList.add('editing');
            item.querySelector('.crud-edit-inline').classList.add('active');
            const input = item.querySelector('.crud-edit-input');
            input.focus();
            input.select();
            input.onkeyup = (ev) => {
                if (ev.key === 'Enter') item.querySelector('.crud-btn.save').click();
                if (ev.key === 'Escape') item.querySelector('.crud-btn.cancel').click();
            };
        }

        if (action === 'save') {
            const input = item.querySelector('.crud-edit-input');
            const nuevoNombre = input?.value.trim();
            if (!nuevoNombre) return;
            try {
                await safeInvoke('update-incidencia', { id, nombre: nuevoNombre });
                Toast.success(MSG.INCIDENCIA_ACTUALIZADA);
                await loadIncidencias();
                await loadSelects();
            } catch (err) {
                console.error('Error editando incidencia:', err);
                Toast.error(MSG.INCIDENCIA_EDIT_ERROR);
            }
        }

        if (action === 'cancel') {
            item.classList.remove('editing');
            item.querySelector('.crud-edit-inline').classList.remove('active');
            const nombre = decodeURIComponent(item.dataset.nombre || '');
            item.querySelector('.crud-edit-input').value = nombre;
        }

        if (action === 'delete') deleteIncidencia(id);
    });

    document.getElementById('actividades-list').addEventListener('click', async (e) => {
        handleActividadClick(e);
    });

    document.getElementById('actividades-list-table')?.addEventListener('click', (e) => {
        handleActividadClick(e);
    });

    const formDireccion = document.getElementById('form-direccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[FORM] submit direccion');
            const input = formDireccion.querySelector('form-input[id="nombre-direccion"]');
            const nombre = input?.value || '';
            console.log('Form submit - nombre:', nombre);
            if (!nombre.trim()) {
                Toast.error(MSG.DIRECCION_VACIA);
                return;
            }
            try {
                const result = await safeInvoke('add-direccion', nombre.trim());
                console.log('add-direccion result:', result);
                Toast.success(MSG.DIRECCION_CREADA);
                input.value = '';
                await loadDirecciones();
                await loadSelects();
            } catch (err) {
                console.error('Error:', err);
                Toast.error(MSG.DIRECCION_ERROR);
            }
        });
    }

    const formIncidencia = document.getElementById('form-incidencia');
    if (formIncidencia) {
        formIncidencia.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[FORM] submit incidencia');
            const input = formIncidencia.querySelector('form-input[id="nombre-incidencia"]');
            const nombre = input?.value || '';
            console.log('Form submit - incidencia:', nombre);
            if (!nombre.trim()) {
                Toast.error(MSG.INCIDENCIA_VACIA);
                return;
            }
            try {
                const result = await safeInvoke('add-incidencia', nombre.trim());
                console.log('add-incidencia result:', result);
                Toast.success(MSG.INCIDENCIA_CREADA);
                input.value = '';
                await loadIncidencias();
                await loadSelects();
            } catch (err) {
                console.error('Error:', err);
                Toast.error(MSG.INCIDENCIA_ERROR);
            }
        });
    }
    
    document.addEventListener('navigate', async (e) => {
        console.log('[DEBUG] Navigate event:', e.detail?.view);
        try {
            if (e.detail.view === 'inicio') {
                await loadDashboard();
            }
            if (e.detail.view === 'direcciones') {
                await loadDirecciones();
            }
            if (e.detail.view === 'incidencias') {
                await loadIncidencias();
            }
            if (e.detail.view === 'actividades') {
                await loadActividades();
                await loadSelects();
            }
            if (e.detail.view === 'informe') {
                await loadInforme();
            }
            if (e.detail.view === 'configuracion') {
                await loadSelects();
            }
        } catch (err) {
            console.error('[DEBUG] Error in navigate handler:', err);
        }
    });
});

document.getElementById('btn-crear-actividad')?.addEventListener('action', async () => {
    const toggleCss = `<style>
        .toggle-wrap { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-secondary); cursor:pointer; user-select:none; }
        .toggle-wrap input[type="checkbox"] { appearance:none; width:36px; height:20px; background:#cbd5e1; border-radius:999px; position:relative; cursor:pointer; transition:background 0.2s; flex-shrink:0; }
        .toggle-wrap input[type="checkbox"]:checked { background:var(--accent-color); }
        .toggle-wrap input[type="checkbox"]::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.2s; }
        .toggle-wrap input[type="checkbox"]:checked::after { transform:translateX(16px); }
    </style>`;
    ModalDialog.open('Nueva Actividad', toggleCss + `
        <form id="crear-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
            <select-dropdown id="crear-dirid" label="Dirección"></select-dropdown>
            <select-dropdown id="crear-incid" label="Incidencia"></select-dropdown>
            <form-textarea id="crear-desc" label="Descripción" placeholder="Detalle la descripción"></form-textarea>
            <label class="toggle-wrap">
                <input type="checkbox" id="crear-toggle-estado">
                <span>Cambiar estado (por defecto: Completado)</span>
            </label>
            <select-dropdown id="crear-estado" label="Estado" style="display:none;"></select-dropdown>
            <button-primary text="CREAR ACTIVIDAD"></button-primary>
        </form>
    `);
    try {
        const modal = ModalDialog.getInstance();
        const root = modal.shadowRoot;
        const form = root.querySelector('#crear-actividad-form');
        if (form) {
            const dirSelect = root.querySelector('#crear-dirid');
            const incSelect = root.querySelector('#crear-incid');
            const descTextarea = root.querySelector('#crear-desc');
            const estadoSelect = root.querySelector('#crear-estado');
            const toggle = root.querySelector('#crear-toggle-estado');
            const dirs = await safeInvoke('get-direcciones');
            const incs = await safeInvoke('get-incidencias');
            if (dirSelect) dirSelect.loadOptions(dirs, 'Seleccione dirección');
            if (incSelect) incSelect.loadOptions(incs, 'Seleccione incidencia');
            if (estadoSelect) estadoSelect.loadOptions(
                [{ id: 'pendiente', nombre: 'Pendiente' }, { id: 'en_proceso', nombre: 'En proceso' }, { id: 'completado', nombre: 'Completado' }],
                'Seleccione estado'
            );
            if (toggle && estadoSelect) {
                toggle.addEventListener('change', () => {
                    estadoSelect.style.display = toggle.checked ? 'block' : 'none';
                    if (!toggle.checked) estadoSelect.value = '';
                });
            }
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const direccionId = dirSelect?.value || '';
                const incidenciaId = incSelect?.value || '';
                const descripcion = descTextarea?.value || '';
                const estado = toggle?.checked ? (estadoSelect?.value || 'completado') : 'completado';
                if (!direccionId || !incidenciaId) {
                    Toast.error(MSG.ACTIVIDAD_SIN_SELECCION);
                    return;
                }
                try {
                    await safeInvoke('add-actividad', { direccionId, incidenciaId, descripcion, estado });
                    Toast.success(MSG.ACTIVIDAD_CREADA);
                    if (descTextarea) descTextarea.value = '';
                    ModalDialog.close();
                    await loadSelects();
                    await loadActividades();
                    const cal = document.getElementById('calendar-view');
                    if (cal && currentLayout === 'calendar') cal.load(cal._year, cal._month);
                } catch (err) {
                    console.error('Error:', err);
                    Toast.error(MSG.ACTIVIDAD_ERROR);
                }
            });
        }
    } catch (err) {
        console.error('[DEBUG] Error setting up crear modal:', err);
    }
});

document.addEventListener('actividad-action', (e) => {
    const { action, id, direccion, incidencia, descripcion, creado, dirid, incid } = e.detail;
    if (action === 'view') {
        const fecha = window.DateUtils?.parse(creado);
        ModalDialog.open('Detalle de Actividad', `
            <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:${window.getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569'};margin-bottom:4px;">Dirección</div>
                    <div style="font-weight:600;color:#0f172a;">${escapeHtml(direccion || '')}</div>
                </div>
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:#475569;margin-bottom:4px;">Incidencia</div>
                    <div style="font-weight:600;color:#0f172a;">${escapeHtml(incidencia || '')}</div>
                </div>
                <div>
                    <div style="font-size:12px;text-transform:uppercase;color:#475569;margin-bottom:4px;">Descripción</div>
                    <div style="color:#0f172a;white-space:pre-wrap;">${escapeHtml(descripcion || 'Sin descripción')}</div>
                </div>
                <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:12px;color:#94a3b8;">
                    Creado ${fecha ? fecha.relative : ''} &middot; ${fecha ? fecha.human : creado}
                </div>
            </div>
        `);
    }
    if (action === 'edit') {
        const desc = descripcion || '';
        const curEstado = e.detail.estado || 'completado';
        const estadoLabels = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', cancelado: 'Cancelado' };
        ModalDialog.open('Editar Actividad', `
            <style>
                .toggle-wrap { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-secondary); cursor:pointer; user-select:none; }
                .toggle-wrap input[type="checkbox"] { appearance:none; width:36px; height:20px; background:#cbd5e1; border-radius:999px; position:relative; cursor:pointer; transition:background 0.2s; flex-shrink:0; }
                .toggle-wrap input[type="checkbox"]:checked { background:var(--accent-color); }
                .toggle-wrap input[type="checkbox"]::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.2s; }
                .toggle-wrap input[type="checkbox"]:checked::after { transform:translateX(16px); }
            </style>
            <form id="edit-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
                <select-dropdown id="edit-dirid" label="Dirección"></select-dropdown>
                <select-dropdown id="edit-incid" label="Incidencia"></select-dropdown>
                <form-textarea id="edit-desc" label="Descripción">${escapeHtml(desc)}</form-textarea>
                <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;">Estado actual: <span class="tag ${curEstado === 'completado' ? 'tag-completado' : curEstado === 'en_proceso' ? 'tag-en_proceso' : 'tag-pendiente'}">${estadoLabels[curEstado] || curEstado}</span></div>
                <label class="toggle-wrap">
                    <input type="checkbox" id="edit-toggle-estado">
                    <span>Cambiar estado</span>
                </label>
                <select-dropdown id="edit-estado" label="Estado" style="display:none;"></select-dropdown>
                <button-primary text="GUARDAR CAMBIOS"></button-primary>
            </form>
        `);
        const editModal = ModalDialog.getInstance();
        const root = editModal.shadowRoot;
        const form = root.querySelector('#edit-actividad-form');
        if (form) {
            const dirSelect = root.querySelector('#edit-dirid');
            const incSelect = root.querySelector('#edit-incid');
            const descTextarea = root.querySelector('#edit-desc');
            const estadoSelect = root.querySelector('#edit-estado');
            const toggle = root.querySelector('#edit-toggle-estado');
            safeInvoke('get-direcciones').then(dirs => {
                if (dirSelect) { dirSelect.loadOptions(dirs, 'Seleccione dirección'); dirSelect.value = dirid || ''; }
            });
            safeInvoke('get-incidencias').then(incs => {
                if (incSelect) { incSelect.loadOptions(incs, 'Seleccione incidencia'); incSelect.value = incid || ''; }
            });
            if (descTextarea && desc) descTextarea.value = desc;
            if (estadoSelect) {
                estadoSelect.loadOptions(
                    [{ id: 'pendiente', nombre: 'Pendiente' }, { id: 'en_proceso', nombre: 'En proceso' }, { id: 'completado', nombre: 'Completado' }],
                    'Seleccione estado'
                );
                estadoSelect.value = curEstado;
            }
            if (toggle && estadoSelect) {
                toggle.addEventListener('change', () => {
                    estadoSelect.style.display = toggle.checked ? 'block' : 'none';
                });
            }
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const newDirId = dirSelect?.value || '';
                const newIncId = incSelect?.value || '';
                const newDesc = descTextarea?.value || '';
                if (!newDirId || !newIncId) { Toast.error(MSG.ACTIVIDAD_SIN_SELECCION); return; }
                try {
                    await safeInvoke('update-actividad', { id, direccionId: newDirId, incidenciaId: newIncId, descripcion: newDesc });
                    if (toggle?.checked && estadoSelect?.value && estadoSelect.value !== curEstado) {
                        await safeInvoke('update-actividad-estado', { id, estado: estadoSelect.value });
                    }
                    Toast.success('Actividad actualizada');
                    ModalDialog.close();
                    loadActividades();
                    const cal = document.getElementById('calendar-view');
                    if (cal && currentLayout === 'calendar') cal.load(cal._year, cal._month);
                } catch (err) { console.error('Error editando:', err); Toast.error('Error al editar actividad'); }
            });
        }
    }
    if (action === 'delete') {
        if (confirm('¿Eliminar esta actividad?')) {
            safeInvoke('delete-actividad', id).then(async () => {
                Toast.success(MSG.ACTIVIDAD_ELIMINADA);
                ModalDialog.closeAll();
                loadActividades();
                const cal = document.getElementById('calendar-view');
                if (cal && currentLayout === 'calendar') cal.load(cal._year, cal._month);
            }).catch(() => Toast.error(MSG.ACTIVIDAD_DELETE_ERROR));
        }
    }
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

document.getElementById('btn-imprimir')?.addEventListener('action', () => {
    window.print();
});

document.getElementById('cfg-direcciones')?.addEventListener('action', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'direcciones' } }));
});

document.getElementById('cfg-incidencias')?.addEventListener('action', () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'incidencias' } }));
});
