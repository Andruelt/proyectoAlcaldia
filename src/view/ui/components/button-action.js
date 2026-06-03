'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

const variants = {
    primary: {
        bg: t.colors.accent,
        color: '#ffffff',
        hoverBg: '#000000',
        border: 'none',
        shadow: '0 1px 2px rgba(0,0,0,0.05)',
        hoverShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    secondary: {
        bg: '#f1f5f9',
        color: t.colors.text,
        hoverBg: '#e2e8f0',
        border: `1px solid ${t.colors.border}`,
        shadow: '0 1px 2px rgba(0,0,0,0.03)',
        hoverShadow: '0 2px 6px rgba(0,0,0,0.08)',
    },
    danger: {
        bg: '#fef2f2',
        color: '#dc2626',
        hoverBg: '#fee2e2',
        border: `1px solid #fecaca`,
        shadow: '0 1px 2px rgba(0,0,0,0.03)',
        hoverShadow: '0 2px 6px rgba(220,38,38,0.12)',
    },
    ghost: {
        bg: 'transparent',
        color: t.colors.textSecondary,
        hoverBg: '#f1f5f9',
        border: 'none',
        shadow: 'none',
        hoverShadow: 'none',
    },
};

export class ButtonAction extends BaseComponent {
    static get observedAttributes() {
        return ['text', 'variant', 'disabled', 'fullwidth'];
    }

    render() {
        const text = this.getAttribute('text') || '';
        const variant = (this.getAttribute('variant') || 'primary');
        const disabled = this.hasAttribute('disabled');
        const fullwidth = this.hasAttribute('fullwidth');
        const v = variants[variant] || variants.primary;

        this.shadowRoot.innerHTML = `<style>
            :host { display: ${fullwidth ? 'block' : 'inline-block'}; }
            .btn-action {
                display: inline-flex; align-items: center; justify-content: center; gap: 6px;
                width: ${fullwidth ? '100%' : 'auto'};
                padding: 8px 18px;
                font-family: ${t.font.family};
                font-size: ${t.font.sizeSm};
                font-weight: ${t.font.weightSemibold};
                letter-spacing: -0.01em;
                color: ${v.color};
                background: ${v.bg};
                border: ${v.border};
                border-radius: 9999px;
                cursor: pointer;
                box-shadow: ${v.shadow};
                transition: all 0.15s ease;
                user-select: none;
                -webkit-font-smoothing: antialiased;
                white-space: nowrap;
                line-height: 1.4;
            }
            .btn-action:hover {
                background: ${v.hoverBg};
                box-shadow: ${v.hoverShadow};
            }
            .btn-action:active {
                transform: scale(0.97);
            }
            .btn-action:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
        </style>
        <button class="btn-action" ${disabled ? 'disabled' : ''}>${text}</button>`;

        const btn = this.shadowRoot.querySelector('.btn-action');
        btn.addEventListener('click', (e) => {
            if (disabled) return;
            const form = this.closest('form');
            if (form) {
                form.requestSubmit();
            }
            this.dispatchEvent(new CustomEvent('action', { bubbles: true, composed: true, detail: { text, variant } }));
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }
}
