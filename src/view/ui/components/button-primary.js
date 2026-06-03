'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class ButtonPrimary extends BaseComponent {
    render() {
        const text = this.getAttribute('text') || '';

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; padding-top: 4px; }
                .btn-primary { width: 100%; padding: 8px ${t.spacing.md}; font-family: ${t.font.family}; font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightMedium}; color: ${t.colors.bg}; background: ${t.colors.accent}; border: none; border-radius: ${t.radius.sm}; cursor: pointer; transition: ${t.transition}; letter-spacing: 0.01em; }
                .btn-primary:hover { background: ${t.colors.accentHover}; }
                .btn-primary:active { transform: scale(0.98); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            </style>
            <button class="btn-primary">${text}</button>`;

        this.shadowRoot.querySelector('.btn-primary').addEventListener('click', () => {
            const form = this.closest('form');
            if (form) {
                console.log('[button-primary] Submitting form:', form.id);
                form.requestSubmit();
            }
        });
    }
}
