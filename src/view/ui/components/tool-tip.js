'use strict';

import { tokens } from '../tokens.js';

const t = tokens;

export class ToolTip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['text'];
    }

    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;
        this.render();
    }

    render() {
        const text = this.getAttribute('text') || '';

        this.shadowRoot.innerHTML = `<style>
            :host { display: inline-flex; position: relative; }
            .trigger { display: inline-flex; }
            .tooltip {
                position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
                padding: 4px 8px;
                font-family: ${t.font.family}; font-size: 11px; font-weight: ${t.font.weightMedium};
                color: #ffffff; background: #1e293b;
                border-radius: 6px; white-space: nowrap;
                pointer-events: none; user-select: none;
                opacity: 0; visibility: hidden;
                transition: opacity 0.12s ease, transform 0.12s ease, visibility 0s 0.12s;
            }
            .tooltip::after {
                content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
                border: 4px solid transparent; border-top-color: #1e293b;
            }
            :host(:hover) .tooltip, :host(:focus-within) .tooltip {
                opacity: 1; visibility: visible;
                transition: opacity 0.12s ease, transform 0.12s ease, visibility 0s 0s;
            }
        </style>
        <div class="trigger"><slot></slot></div>
        <div class="tooltip" role="tooltip">${text}</div>`;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._rendered && oldValue !== newValue && name === 'text') {
            const tip = this.shadowRoot?.querySelector('.tooltip');
            if (tip) tip.textContent = newValue;
        }
    }
}
