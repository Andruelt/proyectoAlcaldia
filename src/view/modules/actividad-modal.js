import { safeInvoke } from '../ui/utils/ipc.js';
import { escapeHtml, escapeAttr } from '../ui/utils/escape.js';

const TOGGLE_STYLE = `
<style>
.rb-toggle-wrap { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-secondary); cursor:pointer; user-select:none; margin: 4px 0; }
.rb-toggle-wrap input[type="checkbox"] { appearance:none; width:36px; height:20px; background:#cbd5e1; border-radius:999px; position:relative; cursor:pointer; transition:background 0.2s; flex-shrink:0; margin: 0; }
.rb-toggle-wrap input[type="checkbox"]:checked { background:var(--accent-color); }
.rb-toggle-wrap input[type="checkbox"]::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.2s; }
.rb-toggle-wrap input[type="checkbox"]:checked::after { transform:translateX(16px); }
</style>`;

const ESTADO_OPTIONS = [
    { id: 'pendiente', nombre: 'Pendiente' },
    { id: 'en_proceso', nombre: 'En proceso' },
    { id: 'completado', nombre: 'Completado' },
    { id: 'cancelado', nombre: 'Cancelado' },
];

const ESTADO_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado', cancelado: 'Cancelado' };
const ESTADO_CLS = { pendiente: 'tag-pendiente', en_proceso: 'tag-en_proceso', completado: 'tag-completado', cancelado: 'tag-cancelado' };

export function tagEstado(estado) {
    const [label, cls] = [ESTADO_LABEL[estado] || estado, ESTADO_CLS[estado] || 'tag-estado'];
    return `<span class="tag ${cls}">${label}</span>`;
}

export function openCrearActividadModal(refresh) {
    const html = TOGGLE_STYLE + `
        <form id="crear-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
            <select-dropdown id="crear-dirid" label="Dirección"></select-dropdown>
            <select-dropdown id="crear-incid" label="Incidencia"></select-dropdown>
            <form-textarea id="crear-desc" label="Descripción" placeholder="Detalle la descripción"></form-textarea>
            <label class="rb-toggle-wrap">
                <input type="checkbox" id="crear-toggle-estado">
                <span>Cambiar estado (por defecto: Completado)</span>
            </label>
            <select-dropdown id="crear-estado" label="Estado" style="display:none;"></select-dropdown>
            <button-primary text="CREAR ACTIVIDAD"></button-primary>
        </form>`;
    ModalDialog.open('Nueva Actividad', html);
    const root = ModalDialog.getInstance();
    const form = root.querySelector('#crear-actividad-form');
    if (!form) return;
    const dirSelect = root.querySelector('#crear-dirid');
    const incSelect = root.querySelector('#crear-incid');
    const descTextarea = root.querySelector('#crear-desc');
    const estadoSelect = root.querySelector('#crear-estado');
    const toggle = root.querySelector('#crear-toggle-estado');

    Promise.all([safeInvoke('get-direcciones'), safeInvoke('get-incidencias')]).then(([dirs, incs]) => {
        if (dirSelect) dirSelect.loadOptions(dirs, 'Seleccione dirección');
        if (incSelect) incSelect.loadOptions(incs, 'Seleccione incidencia');
    });
    if (estadoSelect) estadoSelect.loadOptions(ESTADO_OPTIONS, 'Seleccione estado');
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
            Toast.error(Toast.MESSAGES.ACTIVIDAD_SIN_SELECCION);
            return;
        }
        try {
            await safeInvoke('add-actividad', { direccionId, incidenciaId, descripcion, estado });
            Toast.success(Toast.MESSAGES.ACTIVIDAD_CREADA);
            if (descTextarea) descTextarea.value = '';
            ModalDialog.close();
            if (typeof refresh === 'function') await refresh();
        } catch (err) {
            console.error('Error creando actividad:', err);
            Toast.error(Toast.MESSAGES.ACTIVIDAD_ERROR);
        }
    });
}

export function openEditarActividadModal(actividad, refresh) {
    const html = TOGGLE_STYLE + `
        <form id="edit-actividad-form" style="display:flex;flex-direction:column;gap:16px;">
            <select-dropdown id="edit-dirid" label="Dirección"></select-dropdown>
            <select-dropdown id="edit-incid" label="Incidencia"></select-dropdown>
            <form-textarea id="edit-desc" label="Descripción"></form-textarea>
            <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:8px;">Estado actual: ${tagEstado(actividad.estado || 'pendiente')}</div>
            <label class="rb-toggle-wrap">
                <input type="checkbox" id="edit-toggle-estado">
                <span>Cambiar estado</span>
            </label>
            <select-dropdown id="edit-estado" label="Estado" style="display:none;"></select-dropdown>
            <button-primary text="GUARDAR CAMBIOS"></button-primary>
        </form>`;
    ModalDialog.open('Editar Actividad', html);
    const root = ModalDialog.getInstance();
    const form = root.querySelector('#edit-actividad-form');
    if (!form) return;
    const dirSelect = root.querySelector('#edit-dirid');
    const incSelect = root.querySelector('#edit-incid');
    const descTextarea = root.querySelector('#edit-desc');
    const estadoSelect = root.querySelector('#edit-estado');
    const toggle = root.querySelector('#edit-toggle-estado');

    Promise.all([safeInvoke('get-direcciones'), safeInvoke('get-incidencias')]).then(([dirs, incs]) => {
        if (dirSelect) { dirSelect.loadOptions(dirs, 'Seleccione dirección'); dirSelect.value = actividad.direccion_id || ''; }
        if (incSelect) { incSelect.loadOptions(incs, 'Seleccione incidencia'); incSelect.value = actividad.incidencia_id || ''; }
    });
    if (descTextarea) descTextarea.value = actividad.descripcion || '';
    if (estadoSelect) {
        estadoSelect.loadOptions(ESTADO_OPTIONS, 'Seleccione estado');
        estadoSelect.value = actividad.estado || 'completado';
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
        if (!newDirId || !newIncId) { Toast.error(Toast.MESSAGES.ACTIVIDAD_SIN_SELECCION); return; }
        try {
            await safeInvoke('update-actividad', { id: actividad.id, direccionId: newDirId, incidenciaId: newIncId, descripcion: newDesc });
            if (toggle?.checked && estadoSelect?.value && estadoSelect.value !== actividad.estado) {
                await safeInvoke('update-actividad-estado', { id: actividad.id, estado: estadoSelect.value });
            }
            Toast.success('Actividad actualizada');
            ModalDialog.close();
            if (typeof refresh === 'function') await refresh();
        } catch (err) {
            console.error('Error editando actividad:', err);
            Toast.error('Error al editar actividad');
        }
    });
}

export function openDetalleActividadModal(actividad) {
    const fecha = window.DateUtils?.parse(actividad.created_at);
    const html = `
        <div style="display:flex;flex-direction:column;gap:16px;">
            <div>
                <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Dirección</div>
                <div style="font-weight:600;color:#0f172a;">${escapeHtml(actividad.direccion)}</div>
            </div>
            <div>
                <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Incidencia</div>
                <div style="font-weight:600;color:#0f172a;">${escapeHtml(actividad.incidencia)}</div>
            </div>
            <div>
                <div style="font-size:12px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Descripción</div>
                <div style="color:#0f172a;white-space:pre-wrap;">${escapeHtml(actividad.descripcion || 'Sin descripción')}</div>
            </div>
            <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:12px;color:#94a3b8;">
                Creado ${fecha ? fecha.relative : ''} · ${fecha ? fecha.human : actividad.created_at}
            </div>
        </div>`;
    ModalDialog.open('Detalle de Actividad', html);
}

export function renderCrudItem(item, type) {
    return `
        <div class="crud-item" data-id="${item.id}" data-nombre="${escapeAttr(item.nombre)}">
            <span class="crud-name">${escapeHtml(item.nombre)}</span>
            <div class="crud-edit-inline">
                <input type="text" class="crud-edit-input" value="${escapeAttr(item.nombre)}">
                <button class="crud-btn save" data-action="save">Guardar</button>
                <button class="crud-btn cancel" data-action="cancel">Cancelar</button>
            </div>
            <div class="crud-actions">
                <button class="crud-btn edit" data-action="edit">Editar</button>
                <button class="crud-btn delete" data-action="delete">Eliminar</button>
            </div>
        </div>`;
}
