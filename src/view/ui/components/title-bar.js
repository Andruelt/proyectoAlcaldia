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
            .win-controls {
                display: flex;
                -webkit-app-region: no-drag;
                height: 100%;
                margin-left: auto;
            }
            .win-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 46px;
                height: 100%;
                border: none;
                background: transparent;
                cursor: pointer;
                color: #475569;
                transition: background 0.12s ease, color 0.12s ease;
                padding: 0;
                outline: none;
            }
            .win-btn svg {
                display: block;
            }
            .win-btn:hover {
                background: #e2e8f0;
            }
            .win-btn:active {
                background: #cbd5e1;
            }
            .win-btn.btn-close:hover {
                background: #e81123;
                color: #ffffff;
            }
            .win-btn.btn-close:active {
                background: #bf0f1d;
                color: #ffffff;
            }
            .title {
                flex: 1;
                text-align: center;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 12px;
                font-weight: 600;
                color: #475569;
                letter-spacing: 0.02em;
            }
        </style>
        <div class="titlebar">
            <div class="title">Alcaldía</div>
            <div class="win-controls">
                <button class="win-btn btn-minimize" id="btn-minimize" title="Minimizar">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <line x1="2" y1="6" x2="10" y2="6"/>
                    </svg>
                </button>
                <button class="win-btn btn-maximize" id="btn-maximize" title="Maximizar">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="1.5" y="1.5" width="9" height="9" rx="1"/>
                    </svg>
                </button>
                <button class="win-btn btn-close" id="btn-close" title="Cerrar">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
                    </svg>
                </button>
            </div>
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
