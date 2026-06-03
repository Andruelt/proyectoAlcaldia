'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class FormDate extends BaseComponent {
    get value() {
        return new Date().toISOString().split('T')[0];
    }

    render() {
        const label = this.getAttribute('label') || '';
        const now = new Date();
        const fecha = now.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; }
                .form-row { display: flex; gap: ${t.spacing.md}; }
                .form-group { flex: 1; display: flex; flex-direction: column; gap: ${t.spacing.xs}; }
                .form-label { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; font-family: ${t.font.family}; }
                .date-display { width: 100%; padding: 8px 12px; font-family: ${t.font.family}; font-size: ${t.font.sizeSm}; color: ${t.colors.textSecondary}; background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border}; border-radius: ${t.radius.sm}; cursor: default; }
            </style>
            <div class="form-row"><div class="form-group"><label class="form-label">${label}</label><div class="date-display">${fecha}</div></div></div>`;
    }
}
