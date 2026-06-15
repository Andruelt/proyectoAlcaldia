'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';
import { escapeAttr } from '../utils/escape.js';

const t = tokens;

// Fallback equipos schema (used when main schema isn't provided to renderer)
let EQUIPOS_SCHEMA = window.EQUIPOS_SCHEMA || {
    pc: [
        { key: 'tarjetaMadre', label: 'Tarjeta Madre', type: 'text', placeholder: 'Ej. ASUS PRIME B560M' },
        { key: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej. Intel i7 11700' },
        { key: 'memoria', label: 'Memoria', type: 'text', placeholder: 'Ej. 8GB DDR4' },
        { key: 'discoDuro', label: 'Disco Duro', type: 'text', placeholder: 'Ej. 500GB SSD' },
        { key: 'fuentePoder', label: 'Fuente de Poder', type: 'text', placeholder: 'Ej. 500W ATX' },
        { key: 'unidadOptica', label: 'Unidad Óptica', type: 'text', placeholder: 'Ej. LG DVD-RW' }
    ],
    regulador: [
        { key: 'fase', label: 'Fase', type: 'text', placeholder: 'Ej. Bifásico' },
        { key: 'voltaje', label: 'Voltaje Salida', type: 'text', placeholder: 'Ej. 110V' },
        { key: 'estadoBateria', label: 'Estado de Batería', type: 'text', placeholder: 'Ej. Bueno' }
    ]
};

export class ReportBuilder extends BaseComponent {
    static get observedAttributes() {
        return ['template-id', 'data', 'title'];
    }

    constructor() {
        super();
        this._template = null;
        this._data = {};
        this._fieldIds = new Map();
        this._uid = 'rb-' + Math.random().toString(36).substring(2, 8);
    }

    connectedCallback() {
        if (!this._rendered) {
            this._rendered = true;
            this._syncFromAttributes();
            this.render();
        }
    }

    attributeChangedCallback(name, _oldVal, newVal) {
        if (!this._rendered) return;
        if (name === 'template-id') {
            this._syncFromAttributes();
            this._renderForm();
        } else if (name === 'data') {
            this._syncFromAttributes();
            this._updateFieldValues();
        }
    }

    _syncFromAttributes() {
        const templateId = this.getAttribute('template-id');
        const templates = window.reportTemplates;
        this._template = templateId ? templates?.get(templateId) : null;
        const raw = this.getAttribute('data');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this._data = typeof parsed === 'object' && parsed ? parsed : {};
            } catch (_) {
                this._data = {};
            }
        }
    }

    setTemplate(id) {
        this.setAttribute('template-id', id);
    }

    setData(data) {
        this._data = { ...(data || {}) };
        this._updateFieldValues();
        if (this.shadowRoot?.querySelector('#componentes-container')) {
            this._renderDynamicComponentesUpdate();
        }
    }

    getData() {
        const out = { ...this._data };
        const compContainer = this.shadowRoot.querySelector('#componentes-container');
        if (compContainer) {
            const comps = [];
            compContainer.querySelectorAll('.rb-comp-card').forEach(card => {
                const nombre = card.querySelector('.rb-dynamic-name')?.value || '';
                const customInput = card.querySelector('.rb-estado-custom');
                let estado = '';
                if (customInput && customInput.style.display !== 'none') {
                    estado = customInput.value || '';
                } else {
                    const dropdown = card.querySelector('.rb-estado-dropdown');
                    if (dropdown) estado = dropdown.value || '';
                }
                comps.push({ nombre, estado });
            });
            out.componentes = comps;
        }
        return out;
    }

    _emit() {
        this.dispatchEvent(new CustomEvent('data-change', {
            detail: { ...this._data },
            bubbles: true,
            composed: true,
        }));
    }

    _fieldKey(id) {
        return this._fieldIds.get(id);
    }

    _updateFieldValues() {
        if (!this._template) return;
        const root = this.shadowRoot;
        if (!root) return;
        this._template.fields.forEach(field => {
            const el = root.getElementById(`fld-${field.key}`);
            if (!el) return;
            const v = this._data[field.key];
            if (v !== undefined && v !== null) {
                if (field.type === 'date') {
                    el.value = String(v).split('T')[0];
                } else {
                    el.value = v;
                }
            }
        });
    }

    _renderForm() {
        if (!this._template) {
            const formHost = this.shadowRoot.querySelector('.rb-form');
            if (formHost) formHost.innerHTML = '<div class="rb-empty">Seleccione una plantilla para comenzar</div>';
            return;
        }
        const grouped = this._template.fields.reduce((acc, f) => {
            const g = f.group || 'General';
            if (!acc[g]) acc[g] = [];
            acc[g].push(f);
            return acc;
        }, {});

        this._fieldIds.clear();
        const html = Object.entries(grouped).map(([group, fields]) => {
            const isComponents = group === 'Componentes';
            const fieldsHtml = isComponents
                ? this._renderDynamicComponentes()
                : fields.map(f => this._renderField(f)).join('');
            return `
                <fieldset class="rb-group">
                    <legend class="rb-group-legend">${escapeAttr(group)}</legend>
                    ${fieldsHtml}
                </fieldset>
            `;
        }).join('');

        const formHost = this.shadowRoot.querySelector('.rb-form');
        if (formHost) formHost.innerHTML = html;
        this._attachListeners();
        this._attachDynamicComponentesListeners();
        this._updateFieldValues();
    }

    _renderDynamicComponentes() {
        const componentes = Array.isArray(this._data.componentes) ? this._data.componentes : [];
        const STANDARD = ['', 'OPERATIVO', 'NO OPERATIVO'];
        const cardsHtml = componentes.map((c, i) => {
            const estado = c.estado || '';
            const isCustom = !STANDARD.includes(estado);
            return `
            <div class="rb-comp-card" data-index="${i}">
                <input type="text" class="rb-input rb-dynamic-name" placeholder="Nombre del componente" value="${escapeAttr(c.nombre || '')}">
                <div class="rb-estado-field">
                    <select-dropdown class="rb-estado-dropdown" ${isCustom ? 'style="display:none"' : ''}>
                        <option value="">—</option>
                        <option value="OPERATIVO" ${!isCustom && estado === 'OPERATIVO' ? 'selected' : ''}>OPERATIVO</option>
                        <option value="NO OPERATIVO" ${!isCustom && estado === 'NO OPERATIVO' ? 'selected' : ''}>NO OPERATIVO</option>
                        <option value="__custom__" ${isCustom ? 'selected' : ''}>✏️ Personalizado...</option>
                    </select-dropdown>
                    <input type="text" class="rb-input rb-estado-custom" placeholder="Valor personalizado" value="${escapeAttr(isCustom ? estado : '')}" ${isCustom ? '' : 'style="display:none"'}>
                </div>
                <button type="button" class="rb-remove-btn" data-index="${i}" title="Eliminar componente">×</button>
            </div>`;
        }).join('');
        return `
            <div class="rb-dynamic-componentes">
                <p class="rb-hint" style="margin:0 0 8px;font-size:12px;color:${t.colors.textTertiary};">
                    Si se eliminan todos los componentes el informe se tratará como <strong>Simple</strong> (solo equipo).
                    Si hay al menos un componente, se mostrará la tabla detallada de componentes.
                </p>
                <div id="componentes-container" class="rb-components-grid">
                    ${cardsHtml || '<div class="rb-empty-list">No hay componentes. Presione "+" para agregar uno.</div>'}
                </div>
                <div class="rb-componentes-actions">
                    <button type="button" class="rb-add-component-btn">+ Agregar Componente</button>
                </div>
            </div>`;
    }

    _renderDynamicComponentesUpdate() {
        const container = this.shadowRoot.querySelector('#componentes-container');
        if (!container) return;
        const componentes = Array.isArray(this._data.componentes) ? this._data.componentes : [];
        const STANDARD = ['', 'OPERATIVO', 'NO OPERATIVO'];
        container.innerHTML = componentes.map((c, i) => {
            const estado = c.estado || '';
            const isCustom = !STANDARD.includes(estado);
            return `
            <div class="rb-comp-card" data-index="${i}">
                <input type="text" class="rb-input rb-dynamic-name" placeholder="Nombre del componente" value="${escapeAttr(c.nombre || '')}">
                <div class="rb-estado-field">
                    <select-dropdown class="rb-estado-dropdown" ${isCustom ? 'style="display:none"' : ''}>
                        <option value="">—</option>
                        <option value="OPERATIVO" ${!isCustom && estado === 'OPERATIVO' ? 'selected' : ''}>OPERATIVO</option>
                        <option value="NO OPERATIVO" ${!isCustom && estado === 'NO OPERATIVO' ? 'selected' : ''}>NO OPERATIVO</option>
                        <option value="__custom__" ${isCustom ? 'selected' : ''}>✏️ Personalizado...</option>
                    </select-dropdown>
                    <input type="text" class="rb-input rb-estado-custom" placeholder="Valor personalizado" value="${escapeAttr(isCustom ? estado : '')}" ${isCustom ? '' : 'style="display:none"'}>
                </div>
                <button type="button" class="rb-remove-btn" data-index="${i}" title="Eliminar componente">×</button>
            </div>`;
        }).join('');
        if (componentes.length === 0) {
            container.innerHTML = '<div class="rb-empty-list">No hay componentes. Presione "+" para agregar uno.</div>';
        }
    }

    _attachDynamicComponentesListeners() {
        const root = this.shadowRoot;
        const container = root.querySelector('#componentes-container');
        if (!container) return;

        const STANDARD = ['', 'OPERATIVO', 'NO OPERATIVO'];

        container.addEventListener('input', (e) => {
            const card = e.target.closest('.rb-comp-card');
            if (!card) return;
            const idx = parseInt(card.dataset.index, 10);
            const componentes = Array.isArray(this._data.componentes) ? [...this._data.componentes] : [];
            if (idx >= componentes.length) return;
            if (e.target.classList.contains('rb-dynamic-name')) {
                componentes[idx] = { ...componentes[idx], nombre: e.target.value };
            } else if (e.target.classList.contains('rb-estado-custom')) {
                componentes[idx] = { ...componentes[idx], estado: e.target.value };
            } else {
                return;
            }
            this._data.componentes = componentes;
            this._emit();
        });

        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('rb-estado-dropdown')) {
                const card = e.target.closest('.rb-comp-card');
                if (!card) return;
                const idx = parseInt(card.dataset.index, 10);
                const dropdown = e.target;
                const input = card.querySelector('.rb-estado-custom');
                const value = e.detail?.value ?? '';
                const componentes = Array.isArray(this._data.componentes) ? [...this._data.componentes] : [];
                if (idx >= componentes.length) return;

                if (value === '__custom__') {
                    dropdown.style.display = 'none';
                    input.style.display = '';
                    input.focus();
                    if (STANDARD.includes(componentes[idx].estado || '')) {
                        componentes[idx] = { ...componentes[idx], estado: '' };
                    }
                } else {
                    dropdown.style.display = '';
                    input.style.display = 'none';
                    componentes[idx] = { ...componentes[idx], estado: value };
                }
                this._data.componentes = componentes;
                this._emit();
            }
        });

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.rb-remove-btn');
            if (!btn) return;
            const card = btn.closest('.rb-comp-card');
            if (!card) return;
            const idx = parseInt(card.dataset.index, 10);
            let componentes = Array.isArray(this._data.componentes) ? [...this._data.componentes] : [];
            if (idx >= componentes.length) return;
            componentes.splice(idx, 1);
            this._data.componentes = componentes;
            this._renderDynamicComponentesUpdate();
            this._emit();
        });

        const addBtn = root.querySelector('.rb-add-component-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const componentes = Array.isArray(this._data.componentes) ? [...this._data.componentes] : [];
                componentes.push({ nombre: '', estado: '' });
                this._data.componentes = componentes;
                this._renderDynamicComponentesUpdate();
                this._emit();
            });
        }
    }

    _updateDynamicFields(tipoEquipo) {
        const container = this.shadowRoot.querySelector('#dynamic-fields-container');
        if (!container) return;
        container.innerHTML = '';
        const schemaFields = EQUIPOS_SCHEMA[tipoEquipo] || [];
        // Purge any previous datos_tecnicos keys that are not part of the new schema
        const current = (this._data.datos_tecnicos && typeof this._data.datos_tecnicos === 'object') ? { ...this._data.datos_tecnicos } : {};
        const newDatos = {};
        for (const f of schemaFields) {
            if (Object.prototype.hasOwnProperty.call(current, f.key)) newDatos[f.key] = current[f.key];
            else newDatos[f.key] = '';
        }
        this._data.datos_tecnicos = newDatos;
        schemaFields.forEach(f => {
            const id = `dyn-${f.key}`;
            let html = '';
            if (f.type === 'select') {
                const opts = (f.options || []).map(o => `<option value="${escapeAttr(o.value)}" ${this._data.datos_tecnicos[f.key] === o.value ? 'selected' : ''}>${escapeAttr(o.label)}</option>`).join('');
                const requiredMark = f.required ? '<span class="rb-required">*</span>' : '';
                html = `<label class="rb-label">${escapeAttr(f.label)}${requiredMark}</label><select id="${id}" name="${f.key}" class="rb-input rb-select" data-required="${f.required ? '1' : '0'}"><option value="">—</option>${opts}</select>`;
            } else {
                const val = this._data.datos_tecnicos[f.key] || '';
                const requiredMark = f.required ? '<span class="rb-required">*</span>' : '';
                html = `<label class="rb-label">${escapeAttr(f.label)}${requiredMark}</label><input id="${id}" name="${f.key}" type="text" class="rb-input" value="${escapeAttr(val)}" placeholder="${escapeAttr(f.placeholder || '')}" data-required="${f.required ? '1' : '0'}">`;
            }
            const wrapper = document.createElement('div');
            wrapper.className = 'rb-field';
            wrapper.innerHTML = html;
            container.appendChild(wrapper);
            const el = container.querySelector(`#${id}`);
            if (el) {
                const h = () => {
                    const v = el.value || '';
                    this._data.datos_tecnicos[f.key] = v;
                    // visual validation
                    if (el.getAttribute('data-required') === '1') {
                        if (!v || String(v).trim() === '') el.classList.add('rb-input--invalid');
                        else el.classList.remove('rb-input--invalid');
                    }
                    this._emit();
                };
                el.addEventListener('input', h);
                el.addEventListener('change', h);
            }
        });
    }

    validateDynamic() {
        const container = this.shadowRoot.querySelector('#dynamic-fields-container');
        if (!container) return [];
        const missing = [];
        container.querySelectorAll('[name]').forEach(el => {
            const name = el.getAttribute('name');
            const required = el.getAttribute('data-required') === '1';
            const val = el.value || '';
            if (required && (!val || String(val).trim() === '')) {
                missing.push(name);
                el.classList.add('rb-input--invalid');
            } else {
                el.classList.remove('rb-input--invalid');
            }
        });
        return missing;
    }

    _renderField(f, wrapperClass = 'rb-field') {
        const id = `fld-${f.key}`;
        this._fieldIds.set(id, f.key);
        const value = this._data[f.key] || '';
        const required = f.required ? '<span class="rb-required">*</span>' : '';
        const hint = f.hint ? `<span class="rb-hint">${escapeAttr(f.hint)}</span>` : '';
        let input = '';
        if (f.type === 'longtext') {
            input = `<textarea id="${id}" class="rb-input rb-textarea" rows="${f.rows || 3}" placeholder="${escapeAttr(f.placeholder || '')}"${f.maxLength ? ` maxlength="${f.maxLength}"` : ''}>${escapeAttr(value)}</textarea>`;
        } else if (f.type === 'date') {
            let dateVal = value ? String(value).split('T')[0] : '';
            if (!dateVal && f.key === 'fecha') {
                dateVal = new Date().toISOString().split('T')[0];
            }
            input = `<input id="${id}" type="date" class="rb-input" value="${escapeAttr(dateVal)}">`;
        } else if (f.type === 'select') {
            const options = f.options || [];
            input = `<select id="${id}" class="rb-input rb-select">
                <option value="">— Seleccionar —</option>
                ${options.map(o => `<option value="${escapeAttr(o.value)}"${o.value === value ? ' selected' : ''}>${escapeAttr(o.label)}</option>`).join('')}
            </select>`;
        } else {
            input = `<input id="${id}" type="${f.type === 'number' ? 'number' : 'text'}" class="rb-input" placeholder="${escapeAttr(f.placeholder || '')}" value="${escapeAttr(value)}"${f.maxLength ? ` maxlength="${f.maxLength}"` : ''}>`;
        }
        return `
            <div class="${wrapperClass}">
                <label for="${id}" class="rb-label">${escapeAttr(f.label)}${required}</label>
                ${input}
                ${hint}
            </div>
        `;
    }

    _attachListeners() {
        if (!this._template) return;
        const root = this.shadowRoot;
        this._template.fields.forEach(field => {
            const el = root.getElementById(`fld-${field.key}`);
            if (!el) return;
            const handler = () => {
                this._data[field.key] = el.value || '';
                this._emit();
            };
            el.addEventListener('input', handler);
            el.addEventListener('change', handler);
        });
    }

    render() {
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; }
            .rb-form { display: flex; flex-direction: column; gap: 20px; }
            .rb-empty { padding: 32px; text-align: center; color: ${t.colors.textTertiary}; font-size: 13px; background: ${t.colors.bgSecondary}; border: 1px dashed ${t.colors.border}; border-radius: 12px; }
            .rb-group { border: 1px solid ${t.colors.border}; border-radius: 12px; padding: 20px 24px 24px; background: ${t.colors.bg}; }
            .rb-group-legend { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${t.colors.textTertiary}; font-weight: 600; padding: 0 10px; }
            .rb-field { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
            .rb-label { font-size: 12px; font-weight: 500; color: ${t.colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; font-family: ${t.font.family}; }
            .rb-required { color: #ef4444; margin-left: 2px; }
            .rb-hint { font-size: 11px; color: ${t.colors.textTertiary}; }
            .rb-input {
                box-sizing: border-box; width: 100%; padding: 10px 14px;
                font-family: ${t.font.family}; font-size: 14px; color: ${t.colors.text};
                background: ${t.colors.bg}; border: 1px solid ${t.colors.border};
                border-radius: 10px; outline: none; transition: ${t.transition};
            }
            .rb-input:focus { border-color: ${t.colors.borderFocus}; box-shadow: 0 0 0 3px rgba(100,116,139,0.12); }
            .rb-input--invalid { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
            .rb-textarea { min-height: 80px; resize: vertical; line-height: 1.55; font-family: ${t.font.family}; }
            .rb-select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.4' stroke-linecap='round'><polyline points='6 9 12 15 18 9'/></svg>"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }
            .rb-components-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px 16px; }
            .rb-component-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border}; border-radius: 8px; }
            .rb-component-item .rb-label { font-size: 11px; }
            .rb-dynamic-componentes { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
            .rb-components-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
            .rb-comp-card {
                display: flex; flex-direction: column; gap: 6px; padding: 12px;
                background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border};
                border-radius: 10px; position: relative;
            }
            .rb-comp-card .rb-input { padding: 8px 10px; font-size: 13px; }
            .rb-estado-field { display: flex; gap: 4px; }
            .rb-estado-field .rb-input { flex: 1; min-width: 0; }
            .rb-estado-field .rb-estado-dropdown { flex: 1; min-width: 0; }
            .rb-comp-card .rb-remove-btn {
                position: absolute; top: -6px; right: -6px; width: 24px; height: 24px; padding: 0;
                font-size: 14px; line-height: 1; border-radius: 50%;
                background: ${t.colors.bg}; border: 1px solid ${t.colors.border};
                color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: ${t.transition}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .rb-comp-card .rb-remove-btn:hover { background: #fef2f2; border-color: #fca5a5; }
            .rb-componentes-actions { display: flex; justify-content: flex-start; }
            .rb-add-component-btn {
                padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
                background: ${t.colors.bgSecondary}; border: 1px dashed ${t.colors.border}; border-radius: 8px;
                color: ${t.colors.textSecondary}; transition: ${t.transition}; font-family: ${t.font.family};
            }
            .rb-add-component-btn:hover { background: ${t.colors.borderFocus}; border-color: ${t.colors.borderFocus}; color: ${t.colors.text}; }
            .rb-empty-list { padding: 16px; text-align: center; color: ${t.colors.textTertiary}; font-size: 13px; background: ${t.colors.bgSecondary}; border: 1px dashed ${t.colors.border}; border-radius: 8px; }
        </style>
        <div class="rb-form"></div>`;
        this._renderForm();
    }
}
