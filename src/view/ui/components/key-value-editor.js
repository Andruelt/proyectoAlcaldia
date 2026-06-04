'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class KeyValueEditor extends BaseComponent {
    static get observedAttributes() {
        return ['defaults'];
    }

    constructor() {
        super();
        this._data = [];
    }

    connectedCallback() {
        if (!this._rendered) {
            this._rendered = true;
            const raw = this.getAttribute('defaults');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    this._data = Array.isArray(parsed)
                        ? parsed.map(([k, v]) => ({ key: k, value: v || '' }))
                        : [];
                } catch (_) { /* ignore */ }
            }
            this.render();
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'defaults' && newVal !== oldVal && this._rendered) {
            try {
                const parsed = JSON.parse(newVal);
                this._data = Array.isArray(parsed)
                    ? parsed.map(([k, v]) => ({ key: k, value: v || '' }))
                    : [];
            } catch (_) { /* ignore */ }
            this._renderRows();
        }
    }

    getData() {
        const result = {};
        for (const item of this._data) {
            if (item.key) result[item.key] = item.value || '';
        }
        return result;
    }

    setDefaults(data) {
        this._data = Object.entries(data).map(([k, v]) => ({ key: k, value: v || '' }));
        if (this._rendered) this._renderRows();
    }

    _emitChange() {
        this.dispatchEvent(new CustomEvent('kv-change', {
            detail: this.getData(),
            bubbles: true,
            composed: true
        }));
    }

    _renderRows() {
        const el = this.shadowRoot.querySelector('.kv-rows');
        if (!el) return;
        el.innerHTML = this._data.length === 0
            ? '<div class="kv-empty">Sin campos. Agregue uno para comenzar.</div>'
            : this._data.map((item, i) => `
                <div class="kv-row" data-index="${i}">
                    <input class="kv-key" type="text" value="${this._escAttr(item.key)}" placeholder="Clave" data-index="${i}">
                    <input class="kv-value" type="text" value="${this._escAttr(item.value)}" placeholder="Valor" data-index="${i}">
                    <button class="kv-remove" data-index="${i}" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            `).join('');
    }

    _escAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    render() {
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; }
            .kv-editor { display: flex; flex-direction: column; gap: 8px; }
            .kv-header { display: flex; gap: 8px; margin-bottom: 2px; padding: 0 2px; }
            .kv-col-label { font-size: 10px; text-transform: uppercase; color: ${t.colors.textTertiary}; font-weight: 600; letter-spacing: 0.04em; }
            .kv-col-key { flex: 1; }
            .kv-col-val { flex: 3; }
            .kv-col-act { width: 30px; }
            .kv-rows { display: flex; flex-direction: column; gap: 6px; }
            .kv-row { display: flex; gap: 8px; align-items: center; }
            .kv-empty { font-size: 12px; color: ${t.colors.textTertiary}; padding: 16px; text-align: center; }
            .kv-key, .kv-value {
                box-sizing: border-box; padding: 7px 10px;
                font-family: ${t.font.family}; font-size: 12px; color: ${t.colors.text};
                background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border};
                border-radius: 8px; outline: none; transition: border-color 0.15s;
            }
            .kv-key:focus, .kv-value:focus { border-color: ${t.colors.borderFocus}; background: ${t.colors.bg}; }
            .kv-key { flex: 1; }
            .kv-value { flex: 3; }
            .kv-remove {
                display: flex; align-items: center; justify-content: center;
                width: 30px; height: 30px; border: none; background: transparent;
                color: ${t.colors.textTertiary}; cursor: pointer; border-radius: 6px;
                transition: all 0.15s; flex-shrink: 0;
            }
            .kv-remove:hover { color: #ef4444; background: #fef2f2; }
            .kv-add {
                display: flex; align-items: center; justify-content: center; gap: 6px;
                padding: 8px 14px; border: 1px dashed ${t.colors.border};
                background: transparent; color: ${t.colors.textSecondary};
                border-radius: 10px; cursor: pointer; font-family: ${t.font.family};
                font-size: 12px; transition: all 0.15s; margin-top: 4px;
            }
            .kv-add:hover { border-color: ${t.colors.borderFocus}; color: ${t.colors.text}; background: ${t.colors.bgSecondary}; }
        </style>
        <div class="kv-editor">
            <div class="kv-header">
                <span class="kv-col-label kv-col-key">Clave</span>
                <span class="kv-col-label kv-col-val">Valor</span>
                <span class="kv-col-act"></span>
            </div>
            <div class="kv-rows">${this._renderRowsMarkup()}</div>
            <button class="kv-add">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar campo
            </button>
        </div>`;

        const rowsEl = this.shadowRoot.querySelector('.kv-rows');

        rowsEl.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (!isNaN(idx) && this._data[idx]) {
                if (e.target.classList.contains('kv-key')) {
                    this._data[idx].key = e.target.value;
                } else if (e.target.classList.contains('kv-value')) {
                    this._data[idx].value = e.target.value;
                }
                this._emitChange();
            }
        });

        rowsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.kv-remove');
            if (btn) {
                const idx = parseInt(btn.dataset.index);
                if (!isNaN(idx)) {
                    this._data.splice(idx, 1);
                    this._renderRows();
                    this._emitChange();
                }
            }
        });

        this.shadowRoot.querySelector('.kv-add').addEventListener('click', () => {
            this._data.push({ key: '', value: '' });
            this._renderRows();
        });
    }

    _renderRowsMarkup() {
        if (this._data.length === 0) {
            return '<div class="kv-empty">Sin campos. Agregue uno para comenzar.</div>';
        }
        return this._data.map((item, i) => `
            <div class="kv-row" data-index="${i}">
                <input class="kv-key" type="text" value="${this._escAttr(item.key)}" placeholder="Clave" data-index="${i}">
                <input class="kv-value" type="text" value="${this._escAttr(item.value)}" placeholder="Valor" data-index="${i}">
                <button class="kv-remove" data-index="${i}" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        `).join('');
    }
}
