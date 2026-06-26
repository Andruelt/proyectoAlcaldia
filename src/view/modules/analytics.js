import { safeInvoke } from '../ui/utils/ipc.js';
import { escapeHtml } from '../ui/utils/escape.js';

const QUARTERS = [
    { id: 'q1', label: 'Ene - Mar', inicio: (y) => `${y}-01-01`, fin: (y) => `${y}-03-31` },
    { id: 'q2', label: 'Abr - Jun', inicio: (y) => `${y}-04-01`, fin: (y) => `${y}-06-30` },
    { id: 'q3', label: 'Jul - Sep', inicio: (y) => `${y}-07-01`, fin: (y) => `${y}-09-30` },
    { id: 'q4', label: 'Oct - Dic', inicio: (y) => `${y}-10-01`, fin: (y) => `${y}-12-31` },
];

let _currentQuarter = 0;

function _ensureKeyframes() {
    if (document.getElementById('analytics-animations')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'analytics-animations';
    styleEl.textContent = `
        @keyframes analyticsFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes analyticsRow { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(styleEl);
}

function _setActive(id) {
    document.querySelectorAll('#analytics-quarter-buttons button-action').forEach(b => b.setAttribute('variant', 'secondary'));
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.setAttribute('variant', 'primary');
}

export async function loadAnalytics(inicio, fin) {
    const container = document.getElementById('dashboard-analytics');
    if (!container) return;

    try {
        const data = await safeInvoke('get-analytics-rango', { inicio, fin });
        const total = data.reduce((s, r) => s + r.cantidad, 0);

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9" x2="15" y1="15" y2="15"/><line x1="12" x2="12" y1="12" y2="18"/></svg><p style="font-size:14px;font-weight:500;margin-bottom:4px;">Sin incidencias registradas</p><p style="font-size:12px;color:var(--text-tertiary);">No se encontraron incidencias en este trimestre.</p></div>';
            return;
        }

        _ensureKeyframes();
        const max = Math.max(...data.map(r => r.cantidad), 1);

        container.innerHTML = `
            <div class="analytics-meta" style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px;">${total} actividad${total !== 1 ? 'es' : ''}</div>
            ${data.map((r, i) => {
                const pct = (r.cantidad / max * 100).toFixed(0);
                const hue = (i * 47) % 360;
                const isWide = parseInt(pct) >= 85;
                const barDelay = (0.15 + i * 0.06).toFixed(2);
                return `<div class="analytics-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                    <span style="width:160px;font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(r.incidencia)}</span>
                    <div style="flex:1;height:22px;background:var(--bg-secondary);border-radius:6px;overflow:hidden;position:relative;">
                        <div class="analytics-bar" data-pct="${pct}" style="height:100%;width:0%;background:hsl(${hue},40%,50%);border-radius:6px;transition:width 0.7s cubic-bezier(0.16,1,0.3,1) ${barDelay}s;"></div>
                        ${isWide
                            ? `<span class="analytics-count" style="position:absolute;top:0;right:8px;font-size:10px;font-weight:700;color:#ffffff;line-height:22px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${r.cantidad}</span>`
                            : `<span class="analytics-count" style="position:absolute;top:0;left:${pct}%;font-size:10px;font-weight:600;color:var(--text-primary);line-height:22px;margin-left:6px;white-space:nowrap;">${r.cantidad}</span>`
                        }
                    </div>
                </div>`;
            }).join('')}
        `;

        container.querySelectorAll('.analytics-row').forEach((row, i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-8px)';
            row.style.animation = `analyticsRow 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + i * 0.06}s forwards`;
        });

        requestAnimationFrame(() => {
            container.querySelectorAll('.analytics-bar').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        });
    } catch (err) {
        console.error('Error cargando analytics:', err);
        container.innerHTML = '<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg><p style="font-size:14px;font-weight:500;margin-bottom:4px;">Error al cargar</p><p style="font-size:12px;color:var(--text-tertiary);">No se pudieron obtener las analíticas. Intenta de nuevo.</p></div>';
    }
}

export function initAnalyticsButtons() {
    const now = new Date();
    const year = now.getFullYear();
    _currentQuarter = Math.floor(now.getMonth() / 3);

    QUARTERS.forEach((q, i) => {
        const btn = document.getElementById(`btn-${q.id}`);
        if (!btn) return;
        btn.addEventListener('action', () => {
            _currentQuarter = i;
            _setActive(q.id);
            loadAnalytics(q.inicio(year), q.fin(year));
        });
    });

    const btnRefresh = document.getElementById('btn-refresh-analytics');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const q = QUARTERS[_currentQuarter];
            loadAnalytics(q.inicio(year), q.fin(year));
            const svg = btnRefresh.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(360deg)';
                svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                svg.style.transformOrigin = '50% 50%';
                setTimeout(() => { svg.style.transform = ''; svg.style.transition = ''; }, 600);
            }
        });
    }

    _setActive(QUARTERS[_currentQuarter].id);
    const defaultQ = QUARTERS[_currentQuarter];
    loadAnalytics(defaultQ.inicio(year), defaultQ.fin(year));
}
