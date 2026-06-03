'use strict';

import { tokens } from '../tokens.js';
import { icons } from '../icons.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class NavMenuItem extends BaseComponent {
    static get observedAttributes() {
        return ['icon', 'text', 'view', 'active'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const iconName = this.getAttribute('icon') || 'home';
        const text = this.getAttribute('text') || '';
        const view = this.getAttribute('view') || '';
        const svgIcon = icons[iconName] || icons.home;

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; width: 100%; }
                :host([active]) .nav-item { background: ${t.colors.bg}; color: ${t.colors.text}; font-weight: ${t.font.weightSemibold}; }
                .nav-item {
                    display: flex; align-items: center; gap: ${t.spacing.sm}; padding: ${t.spacing.sm} ${t.spacing.md};
                    border: none; border-radius: ${t.radius.sm}; width: 100%; text-decoration: none;
                    color: ${t.colors.textSecondary}; font-weight: ${t.font.weightNormal};
                    transition: all 0.15s ease; cursor: pointer;
                    font-family: ${t.font.family}; background: transparent; font-size: ${t.font.sizeMd};
                }
                .nav-item:hover { background: ${t.colors.border}; color: ${t.colors.text}; }
                .nav-icon { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: inherit; }
                .nav-text { font-size: ${t.font.sizeMd}; }
            </style>
            <button class="nav-item" data-view="${view}">
                <span class="nav-icon">${svgIcon}</span>
                <span class="nav-text">${text}</span>
            </button>`;

        this.shadowRoot.querySelector('.nav-item').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
        });
    }
}
