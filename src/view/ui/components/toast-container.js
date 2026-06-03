'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;

export class ToastContainer extends BaseComponent {
    render() {
        this.shadowRoot.innerHTML = `<style>
                :host {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    pointer-events: none;
                }
                .toast {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: ${t.radius.sm};
                    font-family: ${t.font.family};
                    font-size: ${t.font.sizeSm};
                    font-weight: ${t.font.weightMedium};
                    min-width: 300px;
                    max-width: 440px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                    animation: toastIn 0.25s ease;
                    pointer-events: auto;
                    cursor: default;
                }
                .toast.success { background: #10b981; color: #ffffff; }
                .toast.error   { background: #ef4444; color: #ffffff; }
                .toast.info    { background: ${t.colors.accent}; color: #ffffff; }
                .toast.removing { animation: toastOut 0.2s ease forwards; }
                .toast-body { flex: 1; line-height: 1.4; }
                .toast-close {
                    background: none; border: none; color: inherit;
                    font-size: 18px; line-height: 1; cursor: pointer;
                    opacity: 0.7; padding: 0; margin-top: -1px;
                }
                .toast-close:hover { opacity: 1; }
                @keyframes toastIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes toastOut {
                    from { transform: translateX(0);    opacity: 1; }
                    to   { transform: translateX(120%); opacity: 0; }
                }
            </style>
            <div id="toast-list"></div>`;
    }

    show(message, type = 'info', duration = 3500) {
        const list = this.shadowRoot.getElementById('toast-list');
        if (!list) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-body">${this._escapeHtml(message)}</span><button class="toast-close" aria-label="Cerrar">&times;</button>`;

        const remove = () => {
            toast.classList.add('removing');
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 200);
        };

        toast.querySelector('.toast-close').addEventListener('click', remove);
        list.appendChild(toast);

        if (duration > 0) {
            setTimeout(remove, duration);
        }
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

let _container = null;

function getContainer() {
    if (!_container) {
        _container = document.createElement('toast-container');
        document.body.appendChild(_container);
    }
    return _container;
}

const MESSAGES = {
    DIRECCION_CREADA: 'Dirección creada correctamente',
    DIRECCION_ACTUALIZADA: 'Dirección actualizada',
    DIRECCION_ELIMINADA: 'Dirección eliminada',
    DIRECCION_ERROR: 'Error al guardar dirección',
    DIRECCION_EDIT_ERROR: 'Error al editar dirección',
    DIRECCION_DELETE_ERROR: 'Error al eliminar dirección',
    DIRECCION_VACIA: 'Ingrese un nombre de dirección',

    INCIDENCIA_CREADA: 'Incidencia creada correctamente',
    INCIDENCIA_ACTUALIZADA: 'Incidencia actualizada',
    INCIDENCIA_ELIMINADA: 'Incidencia eliminada',
    INCIDENCIA_ERROR: 'Error al guardar incidencia',
    INCIDENCIA_EDIT_ERROR: 'Error al editar incidencia',
    INCIDENCIA_DELETE_ERROR: 'Error al eliminar incidencia',
    INCIDENCIA_VACIA: 'Ingrese un nombre de incidencia',

    ACTIVIDAD_CREADA: 'Actividad creada correctamente',
    ACTIVIDAD_ELIMINADA: 'Actividad eliminada',
    ACTIVIDAD_ERROR: 'Error al crear actividad',
    ACTIVIDAD_DELETE_ERROR: 'Error al eliminar actividad',
    ACTIVIDAD_SIN_SELECCION: 'Seleccione dirección e incidencia',
};

window.Toast = {
    MESSAGES,
    success(msg) { getContainer().show(msg, 'success', 3500); },
    error(msg)   { getContainer().show(msg, 'error', 5000);   },
    info(msg)    { getContainer().show(msg, 'info', 3500);    },
    show(msg, type, duration) { getContainer().show(msg, type, duration); },
};
