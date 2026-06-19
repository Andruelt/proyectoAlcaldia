'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

const icons = {
    total: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
};

const tones = {
    neutral: { bg: '#ffffff', accent: '#e2e8f0', iconColor: '#475569' },
    blue: { bg: '#eff6ff', accent: '#bfdbfe', iconColor: '#2563eb' },
    amber: { bg: '#fffbeb', accent: '#fde68a', iconColor: '#d97706' },
    green: { bg: '#f0fdf4', accent: '#bbf7d0', iconColor: '#16a34a' },
    rose: { bg: '#fff1f2', accent: '#fecdd3', iconColor: '#e11d48' },
    violet: { bg: '#f5f3ff', accent: '#ddd6fe', iconColor: '#7c3aed' },
    slate: { bg: '#f8fafc', accent: '#cbd5e1', iconColor: '#334155' },
};

export class StatCard extends BaseComponent {
    static get observedAttributes() { return ['value', 'title', 'trend', 'icon', 'tone']; }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const title = this.getAttribute('title') || '';
        const value = this.getAttribute('value') || '0';
        const trend = this.getAttribute('trend') || '';
        const iconKey = this.getAttribute('icon') || '';
        const iconSvg = icons[iconKey] || iconKey;
        const tone = tones[this.getAttribute('tone')] || tones.neutral;

        this.shadowRoot.innerHTML = `<style>
            :host {
                display: inline-flex;
                width: 100%;
                align-items: center;
                gap: 16px;
                background: ${tone.bg};
                border: 1px solid ${tone.accent};
                border-radius: 999px;
                padding: 20px 26px 20px 20px;
                font-family: ${t.font.family};
                box-sizing: border-box;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            :host(:hover) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
            }
            .icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: ${tone.iconColor};
                flex-shrink: 0;
            }
            .icon svg {
                width: 20px;
                height: 20px;
                display: block;
            }
            .body {
                display: flex;
                flex-direction: column;
                line-height: 1.2;
                min-width: 0;
            }
            .value {
                font-size: 18px;
                font-weight: 600;
                color: ${t.colors.text};
                letter-spacing: -0.01em;
            }
            .title {
                font-size: 11px;
                font-weight: 500;
                color: ${t.colors.textTertiary};
                text-transform: uppercase;
                letter-spacing: 0.04em;
                margin-top: 2px;
                white-space: nowrap;
            }
            .trend {
                font-size: 11px;
                font-weight: 400;
                color: ${t.colors.textSecondary};
                margin-top: 2px;
                white-space: nowrap;
            }
        </style>
        ${iconSvg ? `<div class="icon">${iconSvg}</div>` : ''}
        <div class="body">
            <div class="value">${value}</div>
            <div class="title">${title}</div>
            ${trend ? `<div class="trend">${trend}</div>` : ''}
        </div>`;
    }
}
