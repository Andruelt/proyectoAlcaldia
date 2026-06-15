import { safeInvoke } from '../ui/utils/ipc.js';
import { escapeHtml } from '../ui/utils/escape.js';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

let _periodo = 'trimestral';
let _container = null;
let _titleEl = null;

function _rangoStr(fechaInicio, finDate) {
    const iniM = MESES[new Date(fechaInicio).getMonth()];
    const iniY = new Date(fechaInicio).getFullYear().toString().slice(-2);
    const finM = MESES[finDate.getMonth()];
    const finY = finDate.getFullYear().toString().slice(-2);
    return `${iniM} ${iniY} - ${finM} ${finY}`;
}

function _periodoCalc(periodo) {
    const now = new Date();
    if (periodo === 'semestral') {
        const ini = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return { fechaInicio: ini.toISOString().split('T')[0], label: 'Semestrales' };
    }
    if (periodo === 'anual') {
        const ini = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return { fechaInicio: ini.toISOString().split('T')[0], label: 'Anuales' };
    }
    const ini = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return { fechaInicio: ini.toISOString().split('T')[0], label: 'Trimestrales' };
}

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

export async function loadAnalytics(periodo = _periodo) {
    _container = _container || document.getElementById('dashboard-analytics');
    _titleEl = _titleEl || document.querySelector('#view-inicio h3');
    if (!_container) return;

    const { fechaInicio, label } = _periodoCalc(periodo);
    const now = new Date();
    const newTitle = `Analíticas ${label} (${_rangoStr(fechaInicio, now)})`;

    if (_titleEl) {
        _titleEl.textContent = newTitle;
    }

    try {
        const data = await safeInvoke('get-analytics', fechaInicio);
        const total = data.reduce((s, r) => s + r.cantidad, 0);

        if (!data || data.length === 0) {
            _container.innerHTML = '<div class="empty-state"><p>No hay datos para este período</p></div>';
            return;
        }

        _ensureKeyframes();
        const max = Math.max(...data.map(r => r.cantidad), 1);
        const rangoStr = _rangoStr(fechaInicio, now);

        _container.innerHTML = `
            <div class="analytics-meta" style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px;">${rangoStr} — ${total} actividad${total !== 1 ? 'es' : ''}</div>
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

        _container.querySelectorAll('.analytics-row').forEach((row, i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-8px)';
            row.style.animation = `analyticsRow 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + i * 0.06}s forwards`;
        });

        requestAnimationFrame(() => {
            _container.querySelectorAll('.analytics-bar').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        });
    } catch (err) {
        console.error('Error cargando analytics:', err);
        _container.innerHTML = '<div class="empty-state"><p>Error al cargar analytics</p></div>';
    }
}

export function initAnalyticsButtons() {
    const setActive = (id) => {
        document.querySelectorAll('[id^="btn-analytics-"]').forEach(b => b.setAttribute('variant', 'secondary'));
        const btn = document.getElementById(id);
        if (btn) btn.setAttribute('variant', 'primary');
    };

    document.getElementById('btn-analytics-trimestral')?.addEventListener('action', () => {
        _periodo = 'trimestral';
        setActive('btn-analytics-trimestral');
        loadAnalytics('trimestral');
    });
    document.getElementById('btn-analytics-semestral')?.addEventListener('action', () => {
        _periodo = 'semestral';
        setActive('btn-analytics-semestral');
        loadAnalytics('semestral');
    });
    document.getElementById('btn-analytics-anual')?.addEventListener('action', () => {
        _periodo = 'anual';
        setActive('btn-analytics-anual');
        loadAnalytics('anual');
    });

    const btnRefresh = document.getElementById('btn-refresh-analytics');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            loadAnalytics(_periodo);
            const svg = btnRefresh.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(360deg)';
                svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                svg.style.transformOrigin = '50% 50%';
                setTimeout(() => { svg.style.transform = ''; svg.style.transition = ''; }, 600);
            }
        });
    }
}
