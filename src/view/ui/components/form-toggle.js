'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class FormToggle extends BaseComponent {
    get checked() {
        const input = this.shadowRoot.querySelector('input');
        return input ? input.checked : false;
    }

    render() {
        const label = this.getAttribute('label') || '';
        const id = this.getAttribute('id') || '';

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; }
                .form-row { display: flex; gap: ${t.spacing.md}; }
                .form-group { flex: 1; display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 14px ${t.spacing.md}; background: ${t.colors.bgSecondary}; border: 1px solid ${t.colors.border}; border-radius: ${t.radius.sm}; }
                .toggle-label { font-size: ${t.font.sizeMd}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; font-family: ${t.font.family}; }
                .toggle-switch { position: relative; width: 44px; height: 24px; cursor: pointer; }
                .toggle-input { display: none; }
                .toggle-slider { position: absolute; inset: 0; background: ${t.colors.border}; border-radius: ${t.radius.pill}; transition: ${t.transition}; }
                .toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: ${t.colors.toggleDot}; border-radius: 50%; transition: ${t.transition}; }
                .toggle-input:checked + .toggle-slider { background: ${t.colors.toggleActive}; }
                .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
            </style>
            <div class="form-row"><div class="form-group"><span class="toggle-label">${label}</span><label class="toggle-switch"><input type="checkbox" id="${id}" class="toggle-input"><span class="toggle-slider"></span></label></div></div>`;
    }
}
