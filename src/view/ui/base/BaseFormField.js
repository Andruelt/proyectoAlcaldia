'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from './BaseComponent.js';

const t = tokens;

export const fieldStyles = `
    :host { display: block; }
    .form-row { display: flex; gap: ${t.spacing.md}; }
    .form-group { flex: 1; display: flex; flex-direction: column; gap: ${t.spacing.xs}; }
    .form-label { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; font-family: ${t.font.family}; }
`;

export const inputBase = `box-sizing: border-box; width: 100%; padding: 8px 12px; font-family: ${t.font.family}; font-size: ${t.font.sizeSm}; color: ${t.colors.text}; background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border}; border-radius: ${t.radius.sm}; outline: none; transition: ${t.transition};`;

export class BaseFormField extends BaseComponent {
    renderField(label, id, innerHTML, extraStyles = '') {
        this.shadowRoot.innerHTML = `<style>${fieldStyles}${extraStyles}</style>
            <div class="form-row"><div class="form-group">
                <label${id ? ` for="${id}"` : ''} class="form-label">${label}</label>
                ${innerHTML}
            </div></div>`;
    }

    get value() {
        const el = this.shadowRoot.querySelector('input, textarea, select');
        return el ? el.value : '';
    }

    set value(val) {
        const el = this.shadowRoot.querySelector('input, textarea');
        if (el) el.value = val;
    }
}
