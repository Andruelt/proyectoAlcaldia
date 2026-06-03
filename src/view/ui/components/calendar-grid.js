'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from '../base/BaseComponent.js';

const t = tokens;
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export class CalendarGrid extends BaseComponent {
    constructor() {
        super();
        this._year = new Date().getFullYear();
        this._month = new Date().getMonth() + 1;
        this._data = {};
    }

    async load(y, m) {
        this._year = y;
        this._month = m;
        const inicio = `${y}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        const fin = `${y}-${String(m).padStart(2, '0')}-${String(lastDay + 1).padStart(2, '0')}`;
        try {
            this._data = await window.electronAPI.invoke('get-actividades-rango', { inicio, fin }) || {};
        } catch (e) {
            console.error('Error cargando calendario:', e);
            this._data = {};
        }
        this.render();
    }

    _prevMonth() { let m = this._month - 1, y = this._year; if (m < 1) { m = 12; y--; } this.load(y, m); }
    _nextMonth() { let m = this._month + 1, y = this._year; if (m > 12) { m = 1; y++; } this.load(y, m); }

    _openDayModal(dateStr) {
        const acts = this._data[dateStr] || [];
        const [y, mn, d] = dateStr.split('-');
        const fechaLabel = `${d}/${mn}/${y}`;
        if (acts.length === 0) {
            ModalDialog.open(fechaLabel, `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;font-family:${t.font.family};color:${t.colors.textTertiary};">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style="font-size:14px;font-weight:500;">Sin actividades</span>
                    <span style="font-size:12px;">No se encontraron actividades para el ${fechaLabel}</span>
                </div>
            `);
            return;
        }
        this._currentActs = acts;
        this._page = 0;
        this._pageSize = 20;
        this._renderDayModal(fechaLabel);
    }

    _renderDayModal(fechaLabel) {
        const acts = this._currentActs;
        const total = acts.length;
        const start = this._page * this._pageSize;
        const end = Math.min(start + this._pageSize, total);
        const pageActs = acts.slice(start, end);
        const hasMore = end < total;
        const title = `${total} actividad${total !== 1 ? 'es' : ''} — ${fechaLabel}${total > this._pageSize ? ` (${start + 1}-${end} de ${total})` : ''}`;

        const attachListeners = () => {
            const r = ModalDialog.getInstance().shadowRoot;
            r.querySelectorAll('.cal-modal-item .cal-btn').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const item = btn.closest('[data-id]');
                    if (!item) return;
                    this.dispatchEvent(new CustomEvent('actividad-action', {
                        detail: {
                            action: btn.dataset.action,
                            id: item.dataset.id,
                            direccion: decodeURIComponent(item.dataset.direccion || ''),
                            incidencia: decodeURIComponent(item.dataset.incidencia || ''),
                            descripcion: decodeURIComponent(item.dataset.descripcion || ''),
                            creado: item.dataset.creado || '',
                            dirid: item.dataset.dirid || '',
                            incid: item.dataset.incid || '',
                        },
                        bubbles: true,
                        composed: true,
                    }));
                });
            });
            const moreBtn = r.querySelector('#cal-load-more');
            if (moreBtn) {
                moreBtn.addEventListener('click', () => {
                    this._page++;
                    this._renderDayModal(fechaLabel);
                });
            }
        };

        const moreBtn = hasMore ? `<button id="cal-load-more" style="width:100%;padding:8px;margin-top:8px;border:1px solid ${t.colors.border};border-radius:8px;background:transparent;color:${t.colors.textSecondary};font-family:${t.font.family};font-size:12px;cursor:pointer;transition:${t.transition};">Ver más (${total - end} restantes)</button>` : '';

        ModalDialog.open(title, `
            <div style="display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow-y:auto;padding-right:4px;scrollbar-width:thin;scrollbar-color:${t.colors.border} transparent;">
                ${pageActs.map(a => `
                    <div class="cal-modal-item" data-id="${a.id}" data-direccion="${encodeURIComponent(a.direccion)}" data-incidencia="${encodeURIComponent(a.incidencia)}" data-descripcion="${encodeURIComponent(a.descripcion || '')}" data-creado="${a.created_at}" data-dirid="${a.direccion_id}" data-incid="${a.incidencia_id}">
                        <div class="cal-modal-info">
                            <span class="cal-modal-dir">${this._esc(a.direccion)}</span>
                            <span class="cal-modal-meta">${this._esc(a.incidencia)} &middot; ${this._esc(a.descripcion || 'Sin descripción')}</span>
                        </div>
                        <div class="cal-modal-actions">
                            <button class="cal-btn view" data-action="view">Ver</button>
                            <button class="cal-btn edit" data-action="edit">Editar</button>
                            <button class="cal-btn delete" data-action="delete">Eliminar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${moreBtn}
            <style>
                .cal-modal-item { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid ${t.colors.border}; gap:12px; }
                .cal-modal-item:last-child { border-bottom:none; }
                .cal-modal-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
                .cal-modal-dir { font-size:13px; font-weight:500; color:${t.colors.text}; font-family:${t.font.family}; }
                .cal-modal-meta { font-size:12px; color:${t.colors.textSecondary}; font-family:${t.font.family}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .cal-modal-actions { display:flex; gap:6px; flex-shrink:0; }
                .cal-btn { padding:4px 10px; font-size:11px; font-weight:500; border:none; border-radius:6px; cursor:pointer; transition:${t.transition}; font-family:${t.font.family}; }
                .cal-btn.view { background:${t.colors.accent}; color:${t.colors.bg}; }
                .cal-btn.view:hover { background:${t.colors.accentHover}; }
                .cal-btn.edit { background:${t.colors.bgSecondary}; color:${t.colors.textSecondary}; }
                .cal-btn.edit:hover { background:${t.colors.border}; color:${t.colors.text}; }
                .cal-btn.delete { background:${t.colors.bgSecondary}; color:${t.colors.textTertiary}; }
                .cal-btn.delete:hover { background:${t.colors.border}; color:${t.colors.text}; }
            </style>
        `, attachListeners);
        attachListeners();
    }

    _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    render() {
        const today = new Date().toISOString().split('T')[0];
        const firstDay = new Date(this._year, this._month - 1, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(this._year, this._month, 0).getDate();

        let cells = '';
        for (let i = 0; i < startOffset; i++) cells += '<div class="cal-cell empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this._year}-${String(this._month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const acts = this._data[dateStr] || [];
            const isToday = dateStr === today ? ' today' : '';
            const hasActs = acts.length > 0 ? ' has-acts' : '';
            const chips = acts.slice(0, 5).map(a =>
                `<span class="cal-chip" title="${this._esc(a.direccion)}">${this._esc(a.direccion.substring(0, 12))}${a.direccion.length > 12 ? '...' : ''}</span>`
            ).join('');
            cells += `<button class="cal-cell${isToday}${hasActs}" data-date="${dateStr}">
                <span class="cal-day">${d}</span>
                <div class="cal-chips">${chips}</div>
            </button>`;
        }

        const totalCells = startOffset + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remaining; i++) cells += '<div class="cal-cell empty"></div>';

        this.shadowRoot.innerHTML = `<style>
                :host { display: block; }
                .cal-container { font-family: ${t.font.family}; }
                .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .cal-nav { background: none; border: 1px solid ${t.colors.border}; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${t.colors.textSecondary}; font-size: 16px; transition: ${t.transition}; }
                .cal-nav:hover { background: ${t.colors.bgSecondary}; color: ${t.colors.text}; }
                .cal-month-label { font-size: 16px; font-weight: ${t.font.weightSemibold}; color: ${t.colors.text}; }
                .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
                .cal-day-header { font-size: 11px; font-weight: 500; color: ${t.colors.textTertiary}; text-align: center; padding: 8px 0; text-transform: uppercase; letter-spacing: 0.04em; }
                .cal-cell { aspect-ratio: 1; border: 1px solid ${t.colors.border}; border-radius: 10px; background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: stretch; position: relative; font-family: ${t.font.family}; transition: ${t.transition}; padding: 0; overflow: hidden; }
                .cal-cell.empty { cursor: default; border-color: transparent; }
                .cal-cell:hover:not(.empty) { background: ${t.colors.bgSecondary}; }
                .cal-cell.has-acts { border-style: dashed; border-color: ${t.colors.accent}; }
                .cal-cell.today { border-color: ${t.colors.accent}; border-style: solid; }
                .cal-day { font-size: 13px; font-weight: ${t.font.weightSemibold}; color: ${t.colors.textSecondary}; padding: 5px 7px 0; text-align: right; line-height: 1; }
                .cal-cell.today .cal-day { color: ${t.colors.accent}; }
                .cal-chips { display: flex; flex-direction: column; gap: 2px; padding: 4px 5px 5px; flex: 1; overflow: hidden; }
                .cal-chip { background: ${t.colors.accent}; color: ${t.colors.bg}; font-size: 9px; font-weight: 500; padding: 1px 5px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }
            </style>
            <div class="cal-container">
                <div class="cal-header">
                    <button class="cal-nav prev">&lsaquo;</button>
                    <span class="cal-month-label">${MONTHS[this._month - 1]} ${this._year}</span>
                    <button class="cal-nav next">&rsaquo;</button>
                </div>
                <div class="cal-grid">
                    ${DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
                    ${cells}
                </div>
            </div>`;

        this.shadowRoot.querySelector('.cal-nav.prev').addEventListener('click', () => this._prevMonth());
        this.shadowRoot.querySelector('.cal-nav.next').addEventListener('click', () => this._nextMonth());
        this.shadowRoot.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => this._openDayModal(cell.dataset.date));
        });
    }
}
