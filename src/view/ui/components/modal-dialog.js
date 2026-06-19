'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class ModalDialog extends BaseComponent {
    static get observedAttributes() {
        return ['open'];
    }

    render() {
        this.shadowRoot.innerHTML = `<style>
                :host {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                :host([open]) {
                    display: flex;
                }
                .backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    animation: modalFadeIn 0.2s ease;
                }
                :host([open]) .backdrop {
                    animation: modalFadeIn 0.2s ease;
                }
                .modal-card {
                    position: relative;
                    background: ${t.colors.bg};
                    border-radius: ${t.radius.sm};
                    padding: ${t.spacing.lg} ${t.spacing.lg} 20px;
                    min-width: 420px;
                    max-width: 560px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
                    animation: modalSlideIn 0.25s ease;
                    font-family: ${t.font.family};
                }
                :host([open]) .modal-card {
                    animation: modalSlideIn 0.25s ease;
                }
                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .modal-title {
                    font-size: 18px;
                    font-weight: ${t.font.weightSemibold};
                    color: ${t.colors.text};
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 22px;
                    color: ${t.colors.textSecondary};
                    cursor: pointer;
                    line-height: 1;
                    padding: 0 4px;
                }
                .modal-close:hover {
                    color: ${t.colors.text};
                }
                .modal-body {
                    font-size: ${t.font.sizeSm};
                    color: ${t.colors.text};
                    line-height: 1.6;
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.96) translateY(-8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            </style>
            <div class="backdrop" data-action="close"></div>
            <div class="modal-card">
                <div class="modal-header">
                    <h2 class="modal-title"></h2>
                    <button class="modal-close" data-action="close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body"><slot name="body-content"></slot></div>
            </div>`;

        this.shadowRoot.querySelectorAll('[data-action="close"]').forEach(el => {
            el.addEventListener('click', () => this.close());
        });
    }

    open(title, bodyHTML, onRestore) {
        if (this.hasAttribute('open')) {
            const current = {
                title: this.shadowRoot.querySelector('.modal-title').textContent,
                body: this.innerHTML,
                onRestore: this._onRestore,
            };
            if (!this._stack) this._stack = [];
            this._stack.push(current);
        }
        this._onRestore = onRestore || null;
        this.shadowRoot.querySelector('.modal-title').textContent = title;
        this.innerHTML = `<div slot="body-content">${bodyHTML}</div>`;
        this.setAttribute('open', '');
        if (!this._keyHandler) {
            this._keyHandler = (e) => { if (e.key === 'Escape') this.close(); };
            document.addEventListener('keydown', this._keyHandler);
        }
    }

    close() {
        if (this._stack && this._stack.length > 0) {
            const prev = this._stack.pop();
            this._onRestore = prev.onRestore || null;
            this.shadowRoot.querySelector('.modal-title').textContent = prev.title;
            this.shadowRoot.querySelector('.modal-body').innerHTML = prev.body;
            if (this._onRestore) this._onRestore();
            return;
        }
        this._onRestore = null;
        this.removeAttribute('open');
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    closeAll() {
        this._stack = [];
        this.close();
    }

    static _instance = null;

    static getInstance() {
        if (!ModalDialog._instance) {
            ModalDialog._instance = document.createElement('modal-dialog');
            document.body.appendChild(ModalDialog._instance);
        }
        return ModalDialog._instance;
    }

    static open(title, bodyHTML, onRestore) {
        ModalDialog.getInstance().open(title, bodyHTML, onRestore);
    }

    static close() {
        const inst = ModalDialog._instance;
        if (inst) inst.close();
    }

    static closeAll() {
        const inst = ModalDialog._instance;
        if (inst) inst.closeAll();
    }
}

window.ModalDialog = ModalDialog;
