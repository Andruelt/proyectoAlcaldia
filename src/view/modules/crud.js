import { safeInvoke } from '../ui/utils/ipc.js';
import { renderCrudItem } from './actividad-modal.js';
import { escapeAttr } from '../ui/utils/escape.js';

async function loadList(entity, listId) {
    const list = document.getElementById(listId);
    if (!list) return;
    try {
        const items = await safeInvoke(`get-${entity}`);
        if (!items || items.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No hay registros</p></div>';
            return;
        }
        const label = entity === 'direcciones' ? 'direcciones' : 'incidencias';
        list.innerHTML = `
            <div class="crud-counter">Mostrando ${items.length} ${label}</div>
            ${items.map(renderCrudItem).join('')}`;
    } catch (err) {
        console.error(`Error cargando ${entity}:`, err);
        list.innerHTML = '<div class="empty-state"><p>Error al cargar</p></div>';
    }
}

function attachHandlers(listId, entity, reload) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.addEventListener('click', async (e) => {
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
            const nombre = input?.value.trim();
            if (!nombre) return;
            try {
                await safeInvoke(`update-${entity.slice(0, -1)}`, { id, nombre });
                Toast.success(`Registro actualizado`);
                await reload();
            } catch (err) {
                console.error('Error editando:', err);
                Toast.error('Error al editar');
            }
        }
        if (action === 'cancel') {
            item.classList.remove('editing');
            item.querySelector('.crud-edit-inline').classList.remove('active');
            item.querySelector('.crud-edit-input').value = decodeURIComponent(item.dataset.nombre || '');
        }
        if (action === 'delete') {
            if (confirm(`¿Eliminar este registro?`)) {
                try {
                    await safeInvoke(`delete-${entity.slice(0, -1)}`, id);
                    Toast.success('Registro eliminado');
                    await reload();
                } catch (err) {
                    console.error('Error eliminando:', err);
                    Toast.error('Error al eliminar');
                }
            }
        }
    });
}

function attachForm(formId, entity, reload) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('form-input');
        const nombre = input?.value?.trim() || '';
        if (!nombre) {
            Toast.error('Ingrese un nombre');
            return;
        }
        try {
            await safeInvoke(`add-${entity.slice(0, -1)}`, nombre);
            Toast.success('Registro creado');
            input.value = '';
            await reload();
        } catch (err) {
            console.error('Error creando:', err);
            Toast.error('Error al crear');
        }
    });
}

export function initDirecciones() {
    const reload = () => loadList('direcciones', 'direcciones-list');
    loadList('direcciones', 'direcciones-list');
    attachHandlers('direcciones-list', 'direcciones', reload);
    attachForm('form-direccion', 'direcciones', reload);
    return reload;
}

export function initIncidencias() {
    const reload = () => loadList('incidencias', 'incidencias-list');
    loadList('incidencias', 'incidencias-list');
    attachHandlers('incidencias-list', 'incidencias', reload);
    attachForm('form-incidencia', 'incidencias', reload);
    return reload;
}

export async function refreshSelects() {
    try {
        const [dirs, incs] = await Promise.all([safeInvoke('get-direcciones'), safeInvoke('get-incidencias')]);
        const canCreate = dirs?.length > 0 && incs?.length > 0;
        const warning = document.getElementById('actividad-warning');
        const btnCrear = document.getElementById('btn-crear-actividad');
        if (warning) warning.style.display = canCreate ? 'none' : 'block';
        if (btnCrear) btnCrear.disabled = !canCreate;
        return { dirs, incs, canCreate };
    } catch (err) {
        console.error('Error refrescando selects:', err);
        return { dirs: [], incs: [], canCreate: false };
    }
}
