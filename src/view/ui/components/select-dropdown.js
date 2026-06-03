'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class SelectDropdown extends BaseComponent {
    constructor() {
        super();
        this._options = [];
        this._filtered = [];
        this._selectedIndex = -1;
        this._open = false;
        this._placeholder = 'Seleccione una opción';
        this._value = '';
    }

    static get observedAttributes() {
        return ['label', 'disabled', 'placeholder'];
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
        this._updateTrigger();
    }

    _parseOptionsFromChildren() {
        const children = this.children;
        if (children.length === 0) return false;
        const options = [];
        let defaultValue = '';
        for (const child of children) {
            if (child.tagName === 'OPTION') {
                const val = child.getAttribute('value') || '';
                options.push({ value: val, label: child.textContent });
                if (child.hasAttribute('selected')) defaultValue = val;
            }
        }
        if (options.length > 0) {
            this._options = options;
            this._filtered = [...options];
            if (defaultValue) {
                this._value = defaultValue;
            }
            return true;
        }
        return false;
    }

    loadOptions(items, placeholder) {
        this._options = items.map(item => ({ value: item.id, label: item.nombre }));
        this._placeholder = placeholder || 'Seleccione una opción';
        this._filtered = [...this._options];
        this._selectedIndex = -1;
        this._value = '';
        this._updateTrigger();
        this._renderPanel();
    }

    _updateTrigger() {
        const trigger = this.shadowRoot?.querySelector('.trigger-text');
        if (!trigger) return;
        const selected = this._options.find(o => o.value === this._value);
        trigger.textContent = selected ? selected.label : this._placeholder;
        trigger.style.color = selected ? t.colors.text : t.colors.textTertiary;
    }

    _renderPanel() {
        const list = this.shadowRoot?.querySelector('.options-list');
        if (!list) return;
        if (this._filtered.length === 0) {
            list.innerHTML = '<div class="option-empty">Sin resultados</div>';
            return;
        }
        list.innerHTML = this._filtered.map((opt, i) =>
            `<div class="option-item ${opt.value === this._value ? 'selected' : ''}" data-index="${i}" data-value="${opt.value}">${opt.label}</div>`
        ).join('');
    }

    _filterOptions(query) {
        const q = query.toLowerCase().trim();
        this._filtered = q
            ? this._options.filter(o => o.label.toLowerCase().includes(q))
            : [...this._options];
        this._selectedIndex = -1;
        this._renderPanel();
        const search = this.shadowRoot?.querySelector('.search-input');
        if (search && document.activeElement !== search) {
            search.focus();
        }
    }

    _highlightOption(index) {
        const items = this.shadowRoot?.querySelectorAll('.option-item');
        if (!items || items.length === 0) return;
        if (this._selectedIndex >= 0 && this._selectedIndex < items.length) {
            items[this._selectedIndex].classList.remove('highlighted');
        }
        this._selectedIndex = Math.max(0, Math.min(index, items.length - 1));
        items[this._selectedIndex].classList.add('highlighted');
        items[this._selectedIndex].scrollIntoView({ block: 'nearest' });
    }

    _selectHighlighted() {
        const items = this.shadowRoot?.querySelectorAll('.option-item');
        if (!items || this._selectedIndex < 0 || this._selectedIndex >= items.length) return;
        const val = items[this._selectedIndex].dataset.value;
        this._selectValue(val);
    }

    _selectValue(val) {
        this._value = val;
        this._updateTrigger();
        this._close();
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: val } }));
    }

    _openPanel() {
        if (this.hasAttribute('disabled')) return;
        this._open = true;
        this._filtered = [...this._options];
        this._selectedIndex = -1;
        const panel = this.shadowRoot.querySelector('.dropdown-panel');
        const search = this.shadowRoot.querySelector('.search-input');
        panel.classList.add('open');
        if (search) {
            search.value = '';
            search.focus();
        }
        this._renderPanel();
    }

    _close() {
        this._open = false;
        const panel = this.shadowRoot.querySelector('.dropdown-panel');
        if (panel) panel.classList.remove('open');
    }

    render() {
        const label = this.getAttribute('label') || '';
        this._parseOptionsFromChildren();
        const initialText = this._value
            ? (this._options.find(o => o.value === this._value)?.label || this._placeholder)
            : this._placeholder;
        const initialColor = this._value ? t.colors.text : t.colors.textTertiary;

        this.shadowRoot.innerHTML = `<style>
            :host { display: block; position: relative; }
            .field-label { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; font-family: ${t.font.family}; margin-bottom: 6px; display: block; }
            .trigger {
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
                width: 100%; padding: 8px 12px;
                font-family: ${t.font.family}; font-size: ${t.font.sizeSm}; color: ${t.colors.text};
                background: ${t.colors.bgSecondary};
                border: 1px solid ${t.colors.border}; border-radius: ${t.radius.sm};
                cursor: pointer; transition: ${t.transition};
                box-sizing: border-box; user-select: none;
            }
            .trigger:hover { border-color: ${t.colors.borderFocus}; }
            .trigger:focus, .trigger.focused { border-color: ${t.colors.borderFocus}; outline: none; box-shadow: 0 0 0 3px rgba(100,116,139,0.12); }
            .trigger-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .trigger-chevron { width: 16px; height: 16px; color: ${t.colors.textTertiary}; transition: transform 0.2s ease; flex-shrink: 0; }
            .trigger-chevron.open { transform: rotate(180deg); }
            .dropdown-panel {
                position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
                background: ${t.colors.bg}; border: 1px solid ${t.colors.border};
                border-radius: ${t.radius.sm}; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                opacity: 0; visibility: hidden; transform: translateY(-4px);
                transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s 0.15s;
                overflow: hidden;
            }
            .dropdown-panel.open {
                opacity: 1; visibility: visible; transform: translateY(0);
                transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s 0s;
            }
            .search-wrapper { padding: 6px; border-bottom: 1px solid ${t.colors.border}; }
            .search-input {
                width: 100%; padding: 6px 10px;
                font-family: ${t.font.family}; font-size: ${t.font.sizeSm}; color: ${t.colors.text};
                background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border};
                border-radius: 8px; outline: none; transition: ${t.transition};
                box-sizing: border-box;
            }
            .search-input:focus { border-color: ${t.colors.borderFocus}; }
            .options-list { max-height: 200px; overflow-y: auto; padding: 4px; }
            .option-item {
                padding: 8px 12px; font-family: ${t.font.family}; font-size: ${t.font.sizeSm};
                color: ${t.colors.text}; border-radius: 6px; cursor: pointer;
                transition: background 0.1s ease;
            }
            .option-item:hover { background: ${t.colors.bgSecondary}; }
            .option-item.selected { background: ${t.colors.bgSecondary}; font-weight: ${t.font.weightMedium}; }
            .option-item.highlighted { background: ${t.colors.accent}; color: #ffffff; }
            .option-empty {
                padding: 24px 12px; text-align: center; font-family: ${t.font.family};
                font-size: ${t.font.sizeSm}; color: ${t.colors.textTertiary};
            }
        </style>
        ${label ? `<label class="field-label">${label}</label>` : ''}
        <div class="trigger" id="trigger" tabindex="0" role="combobox" aria-haspopup="listbox">
            <span class="trigger-text" style="color:${initialColor};">${initialText}</span>
            <svg class="trigger-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="dropdown-panel" role="listbox">
            <div class="search-wrapper"><input class="search-input" type="text" placeholder="Buscar..."></div>
            <div class="options-list"></div>
        </div>`;

        const trigger = this.shadowRoot.getElementById('trigger');
        const panel = this.shadowRoot.querySelector('.dropdown-panel');
        const search = this.shadowRoot.querySelector('.search-input');
        const list = this.shadowRoot.querySelector('.options-list');
        const chevron = this.shadowRoot.querySelector('.trigger-chevron');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._open) { this._close(); }
            else { this._openPanel(); }
        });

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this._openPanel();
            }
        });

        search.addEventListener('input', (e) => {
            e.stopPropagation();
            this._filterOptions(search.value);
        });

        search.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'ArrowDown') { e.preventDefault(); this._highlightOption((this._selectedIndex + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this._highlightOption((this._selectedIndex - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); this._selectHighlighted(); }
            if (e.key === 'Escape') { e.preventDefault(); this._close(); trigger.focus(); }
        });

        panel.addEventListener('mousedown', (e) => {
            if (e.target === search || e.target.closest('.search-wrapper')) return;
            const item = e.target.closest('.option-item');
            if (item) {
                e.preventDefault();
                this._selectValue(item.dataset.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (this._open && !e.composedPath().includes(this)) {
                this._close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._open) {
                this._close();
                trigger.focus();
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._rendered && oldValue !== newValue) {
            if (name === 'label') {
                const labelEl = this.shadowRoot?.querySelector('.field-label');
                if (labelEl) labelEl.textContent = newValue;
            }
        }
    }
}
