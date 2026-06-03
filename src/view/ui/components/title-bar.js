'use strict';

export class TitleBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `<style>
            :host {
                display: block;
                position: sticky;
                top: 0;
                z-index: 100;
                width: 100%;
                -webkit-app-region: drag;
            }
            .titlebar {
                display: flex;
                align-items: center;
                height: 36px;
                padding: 0 12px;
                background: #f1f5f9;
                border-bottom: 1px solid #e2e8f0;
                user-select: none;
            }
            .traffic-lights {
                display: flex;
                gap: 8px;
                -webkit-app-region: no-drag;
                padding-right: 12px;
            }
            .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: filter 0.15s ease;
            }
            .dot:hover {
                filter: brightness(0.85);
            }
            .dot svg {
                opacity: 0;
                transition: opacity 0.12s ease;
                pointer-events: none;
            }
            .dot:hover svg {
                opacity: 1;
            }
            .dot-close {
                background: #ff5f57;
            }
            .dot-minimize {
                background: #febc2e;
            }
            .dot-maximize {
                background: #28c840;
            }
            .title {
                flex: 1;
                text-align: center;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 12px;
                font-weight: 600;
                color: #475569;
                letter-spacing: 0.02em;
                padding-right: 76px;
            }
        </style>
        <div class="titlebar">
            <div class="traffic-lights">
                <button class="dot dot-close" id="btn-close" title="Cerrar">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#4a1a1a" stroke-width="1.5" stroke-linecap="round">
                        <line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/>
                    </svg>
                </button>
                <button class="dot dot-minimize" id="btn-minimize" title="Minimizar">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#8a6d00" stroke-width="1.5" stroke-linecap="round">
                        <line x1="3" y1="6" x2="9" y2="6"/>
                    </svg>
                </button>
                <button class="dot dot-maximize" id="btn-maximize" title="Maximizar">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#1a5c1a" stroke-width="1.5">
                        <rect x="2.5" y="2.5" width="7" height="7" rx="1"/>
                    </svg>
                </button>
            </div>
            <div class="title">Alcaldía</div>
        </div>`;

        this.shadowRoot.getElementById('btn-close').addEventListener('click', (e) => {
            e.stopPropagation();
            window.electronAPI?.windowControls?.close();
        });
        this.shadowRoot.getElementById('btn-minimize').addEventListener('click', (e) => {
            e.stopPropagation();
            window.electronAPI?.windowControls?.minimize();
        });
        this.shadowRoot.getElementById('btn-maximize').addEventListener('click', (e) => {
            e.stopPropagation();
            window.electronAPI?.windowControls?.maximize();
        });
    }
}
