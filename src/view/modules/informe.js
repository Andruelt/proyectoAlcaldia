import { safeInvoke } from '../ui/utils/ipc.js';
import { escapeHtml, escapeAttr } from '../ui/utils/escape.js';

let _actividades = [];
let _selectedActividad = null;
let _selectedTemplateId = null;
let _templates = [];
let _format = 'pdf';
let _previewVisible = false;
let _preselectedActividadId = null;

export function setPreselectedActividad(id) {
    _preselectedActividadId = id;
}

function _getCtx() {
    return {
        fecha: new Date().toISOString(),
        actividad: _selectedActividad ? { ..._selectedActividad } : undefined,
    };
}

function _applyDefaults(templateId) {
    const tpl = window.reportTemplates.get(templateId);
    if (!tpl) return {};
    const defaults = tpl.defaultValues(_selectedActividad, _getCtx());
    const today = new Date().toISOString();
    if ('fecha' in defaults && !defaults.fecha) {
        defaults.fecha = today;
    }
    if (_selectedActividad && 'diagnostico' in defaults) {
        defaults.diagnostico = _selectedActividad.descripcion || '';
    }
    if (_selectedActividad && 'descripcion' in defaults) {
        defaults.descripcion = '';
    }
    return defaults;
}

function _validateReportData(data) {
    const tpl = window.reportTemplates.get(_selectedTemplateId);
    if (!tpl) return [];
    return tpl.fields
        .filter(field => field.required)
        .filter(field => {
            const value = data[field.key];
            return value === undefined || value === null || String(value).trim() === '';
        })
        .map(field => field.label);
}

function _updatePreview() {
    const previewEl = document.getElementById('informe-preview');
    const builder = document.getElementById('rb-form-inner');
    if (!previewEl || !_selectedTemplateId) {
        if (previewEl) previewEl.innerHTML = '<div class="empty-state"><p>Selecciona una plantilla para ver la vista previa</p></div>';
        return;
    }
    if (!_selectedActividad) {
        previewEl.innerHTML = '<div class="empty-state"><p>Selecciona una actividad primero para ver una vista previa válida del informe.</p></div>';
        return;
    }
    const data = builder?.getData ? builder.getData() : {};
    previewEl.innerHTML = window.reportTemplates.renderPreview(_selectedTemplateId, data, _getCtx());
}

function _renderTemplatePicker() {
    const host = document.getElementById('rb-template-picker');
    if (!host) return;
    host.innerHTML = _templates.map(t => `
        <button class="rb-tpl ${t.id === _selectedTemplateId ? 'active' : ''}" data-template="${escapeAttr(t.id)}" type="button" title="${escapeAttr(t.description)}">
            <span class="rb-tpl-name">${escapeHtml(t.name)}</span>
        </button>
    `).join('');
    host.querySelectorAll('.rb-tpl').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.template;
            if (id === _selectedTemplateId) return;
            _selectedTemplateId = id;
            _renderTemplatePicker();
            _mountBuilder();
            _updatePreview();
        });
    });
}

function _mountBuilder() {
    const host = document.getElementById('rb-form');
    if (!host) return;
    if (!_selectedTemplateId) {
        host.innerHTML = '';
        return;
    }
    if (!_selectedActividad) {
        host.innerHTML = `<div class="empty-state" style="text-align:center;padding:32px;color:#dc2626;font-size:14px;font-weight:500;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
            <p>⚠️ No se ha seleccionado una actividad.</p>
            <p style="margin-top:4px;font-size:13px;color:#b91c1c;">Selecciona una actividad en el selector superior.</p>
        </div>`;
        _updatePreview();
        return;
    }
    const data = _applyDefaults(_selectedTemplateId);
    // if actividad has stored datos_tecnicos, include them so builder can initialize dynamic fields
    if (_selectedActividad && _selectedActividad.datos_tecnicos) {
        data.datos_tecnicos = _selectedActividad.datos_tecnicos;
        // also propagate tipoEquipo if present
        if (_selectedActividad.tipo_equipo) data.tipoEquipo = _selectedActividad.tipo_equipo;
        if (_selectedActividad.tipo_equipo) data.tipo_equipo = _selectedActividad.tipo_equipo;
    }
    host.innerHTML = `<report-builder id="rb-form-inner" template-id="${escapeAttr(_selectedTemplateId)}"></report-builder>`;
    const builder = host.querySelector('#rb-form-inner');
    if (builder) {
        builder.setData(data);
        builder.addEventListener('data-change', () => _updatePreview());
    }
    _updatePreview();
}

async function _loadActividades() {
    try {
        _actividades = await safeInvoke('get-actividades') || [];
    } catch (err) {
        console.error('Error cargando actividades:', err);
        _actividades = [];
    }
}

async function _loadTemplates() {
    try {
        _templates = await window.electronAPI.reports.templates();
        if (!_selectedTemplateId && _templates.length > 0) {
            _selectedTemplateId = _templates[0].id;
        }
        _renderTemplatePicker();
        _mountBuilder();
    } catch (err) {
        console.error('Error cargando templates:', err);
    }
}

function _setActividad(act) {
    _selectedActividad = act;
    _mountBuilder();
}

function _setPreviewVisible(visible) {
    _previewVisible = visible;
    if (visible) {
        _openPreviewFullscreen();
    } else {
        ModalDialog.close();
    }
}

async function _generate() {
    if (!_selectedTemplateId) {
        Toast.error('Seleccione una plantilla');
        return;
    }
    if (!_selectedActividad) {
        Toast.error('Selecciona una actividad primero para generar el reporte');
        return;
    }
    const builder = document.getElementById('rb-form-inner');
    if (!builder) return;
    const data = builder.getData();
    const missing = _validateReportData(data);
    if (missing.length > 0) {
        Toast.error(`Complete los campos obligatorios: ${missing.join(', ')}`);
        return;
    }
    Toast.info?.(`Generando ${_format === 'pdf' ? 'PDF' : 'Word'}...`);
    try {
        const result = await window.electronAPI.reports.generate({
            templateId: _selectedTemplateId,
            format: _format,
            data,
            actividad: _selectedActividad || undefined,
        });
        if (result?.filePath) Toast.success('Documento guardado correctamente');
    } catch (err) {
        console.error('Error generando informe:', err);
        Toast.error('Error al generar el documento');
    }
}

async function _openPreviewFullscreen() {
    const previewEl = document.getElementById('informe-preview');
    if (!previewEl || !_selectedTemplateId) return;
    const builder = document.getElementById('rb-form-inner');
    const data = builder?.getData ? builder.getData() : {};
    const html = window.reportTemplates.renderPreview(_selectedTemplateId, data, _getCtx());
    let cssText = '';
    try {
        const resp = await fetch('styles.css');
        if (resp.ok) cssText = await resp.text();
    } catch (err) {
        console.warn('No se pudo cargar styles.css para preview modal:', err);
    }

    const modalHtml = `<style>${cssText}</style><div class="rb-preview-fullscreen">${html}</div>`;
    ModalDialog.open('Vista previa', modalHtml, null);
    const inst = ModalDialog.getInstance();
    if (inst) {
        const body = inst.shadowRoot.querySelector('.modal-body');
        if (body) {
            body.style.padding = '0';
            body.style.maxHeight = '85vh';
            body.style.overflow = 'auto';
            body.style.background = '#e2e8f0';
        }
        const card = inst.shadowRoot.querySelector('.modal-card');
        if (card) {
            card.style.maxWidth = '850px';
            card.style.width = '95%';
        }
        const onClose = () => { _previewVisible = false; inst.removeEventListener('modal-close', onClose); };
        inst.addEventListener('modal-close', onClose);
    }
}

let _inited = false;
export async function initInformeEditor() {
    if (!_inited) {
        _inited = true;
        await Promise.all([_loadTemplates(), _loadActividades()]);

        const btnTogglePreview = document.getElementById('btn-toggle-preview');
        const btnClosePreview = document.getElementById('rb-preview-close');
        const btnFullscreen = document.getElementById('rb-preview-fullscreen');
        const btnPdf = document.getElementById('btn-generar-pdf');
        const btnWord = document.getElementById('btn-generar-word');
        const previewEl = document.getElementById('informe-preview');

        const selector = document.getElementById('rb-activity-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                const id = e.detail.value;
                const act = id ? _actividades.find(a => a.id === id) : null;
                _setActividad(act);
            });
        }

        if (btnTogglePreview) btnTogglePreview.addEventListener('click', () => _setPreviewVisible(!_previewVisible));
        if (btnClosePreview) btnClosePreview.addEventListener('click', () => ModalDialog.close());
        if (btnFullscreen) btnFullscreen.addEventListener('click', _openPreviewFullscreen);

        if (previewEl) {
            previewEl.addEventListener('click', (e) => {
                if (e.target.closest('.informe-doc')) _openPreviewFullscreen();
            });
        }

        if (btnPdf) btnPdf.addEventListener('action', () => { _format = 'pdf'; _generate(); });
        if (btnWord) btnWord.addEventListener('action', () => { _format = 'docx'; _generate(); });
    }

    if (_preselectedActividadId) {
        if (_actividades.length === 0) await _loadActividades();
        const act = _actividades.find(a => a.id === _preselectedActividadId);
        if (act) {
            _selectedActividad = act;
            const selector = document.getElementById('rb-activity-selector');
            if (selector) selector.setValue(act.id);
            _mountBuilder();
        }
        _preselectedActividadId = null;
    }
}
