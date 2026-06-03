'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class StatCard extends BaseComponent {
    static get observedAttributes() { return ['value', 'title', 'trend']; }
    attributeChangedCallback() { this.render(); }

    render() {
        const title = this.getAttribute('title') || '';
        const value = this.getAttribute('value') || '0';
        const trend = this.getAttribute('trend') || '';

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; background: ${t.colors.bg}; border-radius: ${t.radius.sm}; padding: ${t.spacing.lg}; }
                .stat-value { font-size: ${t.font.size2xl}; font-weight: ${t.font.weightSemibold}; color: ${t.colors.text}; font-family: ${t.font.family}; letter-spacing: -0.02em; line-height: 1.1; }
                .stat-title { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; margin-top: ${t.spacing.xs}; font-family: ${t.font.family}; }
                .stat-trend { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; margin-top: 4px; }
            </style>
            <div class="stat-card">
                <div class="stat-value">${value}</div>
                <div class="stat-title">${title}</div>
                ${trend ? `<div class="stat-trend">${trend}</div>` : ''}
            </div>`;
    }
}
