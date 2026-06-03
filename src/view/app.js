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

        list.innerHTML = actividades.map(a => `
            <div class="crud-item" data-id="${a.id}" data-direccion="${encodeURIComponent(a.direccion)}" data-incidencia="${encodeURIComponent(a.incidencia)}" data-descripcion="${encodeURIComponent(a.descripcion || '')}" data-creado="${a.created_at}" data-dirid="${a.direccion_id}" data-incid="${a.incidencia_id}">
                <div class="crud-info">
                    <span class="crud-name">${escapeHtml(a.direccion)}</span>
                    <span class="crud-meta">${escapeHtml(a.incidencia)} &middot; ${escapeHtml(a.descripcion || 'Sin descripción')}</span>
                </div>
                <div class="crud-actions">
                    <button class="crud-btn view" data-action="view">Ver</button>
                    <button class="crud-btn edit" data-action="edit">Editar</button>
                    <button class="crud-btn delete" data-action="delete">Eliminar</button>
                </div>
            </div>
        `).join('');

        if (tableBody) {
            tableBody.innerHTML = actividades.map(a => {
                const fecha = window.DateUtils?.parse(a.created_at);
                return `<tr data-id="${a.id}" data-direccion="${encodeURIComponent(a.direccion)}" data-incidencia="${encodeURIComponent(a.incidencia)}" data-descripcion="${encodeURIComponent(a.descripcion || '')}" data-creado="${a.created_at}" data-dirid="${a.direccion_id}" data-incid="${a.incidencia_id}">
                    <td class="cell-dir">${escapeHtml(a.direccion)}</td>
                    <td class="cell-meta">${escapeHtml(a.incidencia)}</td>
                    <td class="cell-meta">${escapeHtml(a.descripcion || '—')}</td>
                    <td class="cell-fecha">${fecha ? fecha.relative : a.created_at}</td>
                    <td class="crud-actions">
                        <button class="crud-btn view" data-action="view">Ver</button>
                        <button class="crud-btn edit" data-action="edit">Editar</button>
                        <button class="crud-btn delete" data-action="delete">Eliminar</button>
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
    const btn = e.target.closest('.crud-btn');
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
        ModalDialog.open('Editar Actividad', `
            <form id="edit-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
                <form-select id="edit-dirid" label="Dirección"></form-select>
                <form-select id="edit-incid" label="Incidencia"></form-select>
                <form-textarea id="edit-desc" label="Descripción">${escapeHtml(desc)}</form-textarea>
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
            const dirs = await safeInvoke('get-direcciones');
            const incs = await safeInvoke('get-incidencias');
            if (dirSelect) {
                dirSelect.loadOptions(dirs, 'Seleccione dirección');
                dirSelect.shadowRoot.querySelector('select').value = dirId;
            }
            if (incSelect) {
                incSelect.loadOptions(incs, 'Seleccione incidencia');
                incSelect.shadowRoot.querySelector('select').value = incId;
            }
            if (descTextarea && desc) descTextarea.value = desc;
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

async function loadDashboard(periodo = 'mensual', inicio = null, fin = null) {
    try {
        const now = new Date();
        let fechaInicio, fechaFin;

        if (periodo === 'rango' && inicio && fin) {
            fechaInicio = inicio;
            fechaFin = fin;
        } else if (periodo === 'semanal') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            fechaInicio = new Date(now.setDate(diff)).toISOString().split('T')[0];
            fechaFin = new Date(now.setDate(diff + 7)).toISOString().split('T')[0];
        } else if (periodo === 'mensual') {
            fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
        } else if (periodo === 'anual') {
            fechaInicio = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            fechaFin = new Date(now.getFullYear() + 1, 0, 1).toISOString().split('T')[0];
        }

        const actividades = await safeInvoke('get-actividades-rango', { inicio: fechaInicio, fin: fechaFin });
        const allActs = Object.values(actividades).flat();

        const actCard = document.getElementById('stat-actividades');
        if (actCard) actCard.setAttribute('value', String(allActs.length));

        const container = document.getElementById('dashboard-actividades');
        if (!container) return;

        if (allActs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay actividades en este período</p></div>';
            return;
        }

        container.innerHTML = `
            <table class="lista-actividades">
                <thead>
                    <tr>
                        <th>Dirección</th>
                        <th>Incidencia</th>
                        <th>Descripción</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${allActs.map(a => {
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
        console.error('Error cargando dashboard:', err);
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
    const filterSelect = document.querySelector('#view-informe form-select[id="filter-direccion"]');
    if (!filterSelect) return;
    try {
        const dirs = await safeInvoke('get-direcciones');
        filterSelect.loadOptions(dirs, 'Todas las direcciones');
        filterSelect.shadowRoot.querySelector('select').addEventListener('change', (e) => {
            loadInforme(e.target.value || undefined);
        });
    } catch (err) {
        console.error('Error cargando filtros de informe:', err);
    }
}

function initDashboardFilters() {
    const periodoSelect = document.querySelector('#dashboard-periodo');
    const rangoFechas = document.getElementById('rango-fechas');
    const btnAplicar = document.getElementById('btn-aplicar-rango');
    const inputInicio = document.getElementById('rango-inicio');
    const inputFin = document.getElementById('rango-fin');

    if (!periodoSelect) return;

    const selectEl = periodoSelect.shadowRoot?.querySelector('select');
    if (selectEl) {
        selectEl.addEventListener('change', (e) => {
            const periodo = e.target.value;
            if (periodo === 'rango') {
                rangoFechas.style.display = 'flex';
            } else {
                rangoFechas.style.display = 'none';
                loadDashboard(periodo);
            }
        });
    }

    if (btnAplicar) {
        btnAplicar.addEventListener('click', () => {
            const inicio = inputInicio?.value;
            const fin = inputFin?.value;
            if (inicio && fin) {
                loadDashboard('rango', inicio, fin);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded fired');
    
    try {
    loadDashboard();
    loadDirecciones();
    loadIncidencias();
    loadActividades();
    loadSelects();
    initInformeFilters();
    initDashboardFilters();
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
        } catch (err) {
            console.error('[DEBUG] Error in navigate handler:', err);
        }
    });
});

document.getElementById('btn-crear-actividad')?.addEventListener('click', async () => {
    ModalDialog.open('Nueva Actividad', `
        <form id="crear-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
            <form-select id="crear-dirid" label="Dirección"></form-select>
            <form-select id="crear-incid" label="Incidencia"></form-select>
            <form-textarea id="crear-desc" label="Descripción" placeholder="Detalle la descripción"></form-textarea>
            <button-primary text="CREAR ACTIVIDAD"></button-primary>
        </form>
    `);
    try {
        const modal = ModalDialog.getInstance();
        const root = modal.shadowRoot;
        const form = root.querySelector('#crear-actividad-form');
        console.log('[DEBUG] crear-actividad modal form found:', !!form);
        if (form) {
            const dirSelect = root.querySelector('#crear-dirid');
            const incSelect = root.querySelector('#crear-incid');
            const descTextarea = root.querySelector('#crear-desc');
            console.log('[DEBUG] selects found:', !!dirSelect, !!incSelect);
            const dirs = await safeInvoke('get-direcciones');
            const incs = await safeInvoke('get-incidencias');
            if (dirSelect) dirSelect.loadOptions(dirs, 'Seleccione dirección');
            if (incSelect) incSelect.loadOptions(incs, 'Seleccione incidencia');
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const direccionId = dirSelect?.value || '';
                const incidenciaId = incSelect?.value || '';
                const descripcion = descTextarea?.value || '';
                if (!direccionId || !incidenciaId) {
                    Toast.error(MSG.ACTIVIDAD_SIN_SELECCION);
                    return;
                }
                try {
                    await safeInvoke('add-actividad', { direccionId, incidenciaId, descripcion });
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
        ModalDialog.open('Editar Actividad', `
            <form id="edit-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
                <form-select id="edit-dirid" label="Dirección"></form-select>
                <form-select id="edit-incid" label="Incidencia"></form-select>
                <form-textarea id="edit-desc" label="Descripción">${escapeHtml(desc)}</form-textarea>
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
            safeInvoke('get-direcciones').then(dirs => {
                if (dirSelect) { dirSelect.loadOptions(dirs, 'Seleccione dirección'); dirSelect.shadowRoot.querySelector('select').value = dirid || ''; }
            });
            safeInvoke('get-incidencias').then(incs => {
                if (incSelect) { incSelect.loadOptions(incs, 'Seleccione incidencia'); incSelect.shadowRoot.querySelector('select').value = incid || ''; }
            });
            if (descTextarea && desc) descTextarea.value = desc;
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const newDirId = dirSelect?.value || '';
                const newIncId = incSelect?.value || '';
                const newDesc = descTextarea?.value || '';
                if (!newDirId || !newIncId) { Toast.error(MSG.ACTIVIDAD_SIN_SELECCION); return; }
                try {
                    await safeInvoke('update-actividad', { id, direccionId: newDirId, incidenciaId: newIncId, descripcion: newDesc });
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

document.getElementById('btn-imprimir')?.addEventListener('click', () => {
    window.print();
});
