'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';
import { escapeHtml, escapeAttr } from '../utils/escape.js';
import { safeInvoke } from '../utils/ipc.js';
import { tagEstado } from '../../modules/actividad-modal.js';

const t = tokens;
const PAGE_SIZE = 8;

export class ActivitySelector extends BaseComponent {
    static get observedAttributes() {
        return ['value', 'placeholder'];
    }

    constructor() {
        super();
        this._actividades = [];
        this._selected = null;
        this._open = false;
        this._query = '';
        this._page = 1;
    }

    connectedCallback() {
        if (!this._rendered) {
            this._rendered = true;
            this.render();
            this._attach();
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'value') this._syncValue();
    }

    async _attach() {
        try {
            this._actividades = await safeInvoke('get-actividades') || [];
        } catch (err) {
            console.error('Error cargando actividades:', err);
            this._actividades = [];
        }
        this._syncValue();
        this._renderList();
        this._renderTrigger();
    }

    _syncValue() {
        const id = this.getAttribute('value');
        this._selected = id ? (this._actividades.find(a => a.id === id) || null) : null;
    }

    setValue(id) {
        if (id === null || id === undefined || id === '') {
            this._selected = null;
            this.removeAttribute('value');
        } else {
            this._selected = this._actividades.find(a => a.id === id) || null;
            this.setAttribute('value', id);
        }
        this._renderTrigger();
        this._renderList();
    }

    getValue() {
        return this._selected?.id || '';
    }

    _filtered() {
        const q = this._query.trim().toLowerCase();
        if (!q) return this._actividades;
        return this._actividades.filter(a =>
            (a.direccion || '').toLowerCase().includes(q) ||
            (a.incidencia || '').toLowerCase().includes(q) ||
            (a.descripcion || '').toLowerCase().includes(q)
        );
    }

    _renderTrigger() {
        const trigger = this.shadowRoot?.querySelector('.rb-as-trigger');
        if (!trigger) return;
        const label = this.shadowRoot.querySelector('.rb-as-trigger-label');
        if (this._selected) {
            label.innerHTML = `
                <span class="rb-as-name">${escapeHtml(this._selected.direccion || 'Sin dirección')}</span>
                <span class="rb-as-sub">${escapeHtml(this._selected.incidencia || '')}</span>
            `;
            trigger.classList.add('has-value');
        } else {
            label.textContent = this.getAttribute('placeholder') || 'Selecciona una actividad';
            trigger.classList.remove('has-value');
        }
    }

    _renderList() {
        const list = this.shadowRoot?.querySelector('.rb-as-list');
        if (!list) return;
        const all = this._filtered();
        const total = all.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (this._page > totalPages) this._page = totalPages;
        const start = (this._page - 1) * PAGE_SIZE;
        const pageItems = all.slice(start, start + PAGE_SIZE);

        if (total === 0) {
            list.innerHTML = '<div class="rb-as-empty">Sin actividades</div>';
            this._renderPagination(0, 0);
            return;
        }

        list.innerHTML = pageItems.map(a => {
            const fecha = window.DateUtils?.parse(a.created_at);
            const isActive = this._selected?.id === a.id;
            return `<div class="rb-as-item ${isActive ? 'selected' : ''}" data-id="${escapeAttr(a.id)}">
                <div class="rb-as-item-main">
                    <div class="rb-as-item-row">
                        <span class="rb-as-item-dir">${escapeHtml(a.direccion || '')}</span>
                        ${tagEstado(a.estado)}
                    </div>
                    <div class="rb-as-item-meta">${escapeHtml(a.incidencia || '')} · ${escapeHtml((a.descripcion || 'Sin descripción').substring(0, 80))}</div>
                </div>
                <span class="rb-as-item-fecha">${fecha ? fecha.short : ''}</span>
            </div>`;
        }).join('');

        this._renderPagination(total, totalPages);
    }

    _renderPagination(total, totalPages) {
        const pag = this.shadowRoot?.querySelector('.rb-as-pagination');
        if (!pag) return;
        if (totalPages <= 1) {
            pag.innerHTML = `<span class="rb-as-count">${total} actividad${total !== 1 ? 'es' : ''}</span>`;
            return;
        }
        pag.innerHTML = `
            <button ${this._page <= 1 ? 'disabled' : ''} data-action="prev">‹</button>
            <span class="rb-as-count">${this._page} / ${totalPages}</span>
            <button ${this._page >= totalPages ? 'disabled' : ''} data-action="next">›</button>
        `;
    }

    _toggle(forceState) {
        this._open = forceState !== undefined ? forceState : !this._open;
        const dropdown = this.shadowRoot?.querySelector('.rb-as-dropdown');
        if (dropdown) dropdown.classList.toggle('open', this._open);
        if (this._open) {
            const search = this.shadowRoot?.querySelector('.rb-as-search input');
            if (search) {
                search.value = '';
                this._query = '';
                this._page = 1;
                this._renderList();
                setTimeout(() => search.focus(), 50);
            }
        }
    }

    _close() {
        this._open = false;
        const dropdown = this.shadowRoot?.querySelector('.rb-as-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    }

    _onSelect(id) {
        this.setValue(id);
        this._close();
        this.dispatchEvent(new CustomEvent('change', { detail: { value: id, actividad: this._selected }, bubbles: true, composed: true }));
    }

    render() {
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; position: relative; width: 100%; max-width: 520px; }
            .rb-as-trigger {
                display: flex; align-items: center; justify-content: space-between; gap: 10px;
                width: 100%; padding: 10px 14px;
                font-family: ${t.font.family}; font-size: 13px;
                color: ${t.colors.text};
                background: ${t.colors.bg}; border: 1px solid ${t.colors.border}; border-radius: 10px;
                cursor: pointer; transition: all 0.15s ease; text-align: left; box-sizing: border-box;
            }
            .rb-as-trigger:hover { border-color: ${t.colors.borderFocus}; }
            .rb-as-trigger.open { border-color: ${t.colors.borderFocus}; box-shadow: 0 0 0 3px rgba(100,116,139,0.12); }
            .rb-as-trigger-label { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            .rb-as-trigger:not(.has-value) .rb-as-trigger-label { color: ${t.colors.textTertiary}; }
            .rb-as-name { font-weight: 600; font-size: 13px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .rb-as-sub { font-size: 11px; color: ${t.colors.textTertiary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .rb-as-trigger.has-value .rb-as-sub { display: none; }
            .rb-as-chevron { width: 16px; height: 16px; color: ${t.colors.textTertiary}; transition: transform 0.2s ease; flex-shrink: 0; }
            .rb-as-trigger.open .rb-as-chevron { transform: rotate(180deg); }
            .rb-as-clear {
                width: 22px; height: 22px; border: none; background: transparent;
                color: ${t.colors.textTertiary}; cursor: pointer; border-radius: 6px;
                display: none; align-items: center; justify-content: center; flex-shrink: 0;
            }
            .rb-as-clear:hover { color: #ef4444; background: #fef2f2; }
            .rb-as-trigger.has-value .rb-as-clear { display: inline-flex; }
            .rb-as-dropdown {
                position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50;
                background: ${t.colors.bg}; border: 1px solid ${t.colors.border}; border-radius: 12px;
                box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
                opacity: 0; visibility: hidden; transform: translateY(-4px);
                transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s 0.15s;
                max-height: 460px; display: flex; flex-direction: column;
            }
            .rb-as-dropdown.open { opacity: 1; visibility: visible; transform: translateY(0); transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s 0s; }
            .rb-as-search { padding: 10px; border-bottom: 1px solid ${t.colors.border}; }
            .rb-as-search input {
                width: 100%; padding: 8px 12px;
                font-family: ${t.font.family}; font-size: 13px; color: ${t.colors.text};
                background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border};
                border-radius: 8px; outline: none; box-sizing: border-box;
            }
            .rb-as-search input:focus { border-color: ${t.colors.borderFocus}; }
            .rb-as-list { flex: 1; overflow-y: auto; padding: 6px; }
            .rb-as-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: ${t.colors.textTertiary}; }
            .rb-as-item {
                display: flex; align-items: center; gap: 10px; padding: 10px 12px;
                border-radius: 8px; cursor: pointer; transition: background 0.1s ease;
            }
            .rb-as-item:hover { background: ${t.colors.bgSecondary}; }
            .rb-as-item.selected { background: ${t.colors.bgSecondary}; }
            .rb-as-item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            .rb-as-item-row { display: flex; align-items: center; gap: 8px; }
            .rb-as-item-dir { font-weight: 600; font-size: 13px; color: ${t.colors.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .rb-as-item-meta { font-size: 11px; color: ${t.colors.textTertiary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .rb-as-item-fecha { font-size: 11px; color: ${t.colors.textTertiary}; white-space: nowrap; }
            .rb-as-pagination {
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
                padding: 8px 10px; border-top: 1px solid ${t.colors.border};
                font-size: 12px; color: ${t.colors.textSecondary};
            }
            .rb-as-pagination button {
                width: 26px; height: 26px; border: 1px solid ${t.colors.border};
                background: ${t.colors.bg}; color: ${t.colors.text};
                border-radius: 6px; cursor: pointer; transition: all 0.15s;
            }
            .rb-as-pagination button:hover:not(:disabled) { background: ${t.colors.bgSecondary}; }
            .rb-as-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        </style>
        <button class="rb-as-trigger" type="button" id="trigger">
            <span class="rb-as-trigger-label">${escapeHtml(this.getAttribute('placeholder') || 'Selecciona una actividad')}</span>
            <button class="rb-as-clear" type="button" id="clear" title="Quitar selección">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <svg class="rb-as-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="rb-as-dropdown" id="dropdown">
            <div class="rb-as-search"><input type="text" placeholder="Buscar actividad…"/></div>
            <div class="rb-as-list"></div>
            <div class="rb-as-pagination"></div>
        </div>`;

        const trigger = this.shadowRoot.getElementById('trigger');
        const clear = this.shadowRoot.getElementById('clear');
        const search = this.shadowRoot.querySelector('.rb-as-search input');
        const list = this.shadowRoot.querySelector('.rb-as-list');
        const pag = this.shadowRoot.querySelector('.rb-as-pagination');

        trigger.addEventListener('click', (e) => {
            if (e.target.closest('#clear')) return;
            this._toggle();
        });
        clear.addEventListener('click', (e) => {
            e.stopPropagation();
            this._onSelect('');
        });
        search.addEventListener('input', (e) => {
            this._query = e.target.value;
            this._page = 1;
            this._renderList();
        });
        search.addEventListener('click', (e) => e.stopPropagation());
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.rb-as-item');
            if (item) this._onSelect(item.dataset.id);
        });
        pag.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const total = this._filtered().length;
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            if (action === 'prev' && this._page > 1) { this._page--; this._renderList(); }
            if (action === 'next' && this._page < totalPages) { this._page++; this._renderList(); }
        });

        document.addEventListener('click', (e) => {
            if (this._open && !e.composedPath().includes(this)) this._close();
        });
    }
}
