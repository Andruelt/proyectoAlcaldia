import { safeInvoke } from '../ui/utils/ipc.js';

function _calcPeriodo(periodo, inicio, fin) {
    const now = new Date();
    if (periodo === 'rango' && inicio && fin) {
        return { fechaInicio: inicio, fechaFin: fin };
    }
    if (periodo === 'semanal') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return {
            fechaInicio: new Date(now.setDate(diff)).toISOString().split('T')[0],
            fechaFin: new Date(now.setDate(diff + 7)).toISOString().split('T')[0],
        };
    }
    if (periodo === 'mensual') {
        return {
            fechaInicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            fechaFin: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
        };
    }
    if (periodo === 'anual') {
        return {
            fechaInicio: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
            fechaFin: new Date(now.getFullYear() + 1, 0, 1).toISOString().split('T')[0],
        };
    }
    return { fechaInicio: null, fechaFin: null };
}

function _trendArrow(pct) {
    if (pct === 0) return '→ 0%';
    return pct > 0 ? `▲ +${pct}%` : `▼ ${pct}%`;
}

function _fmtTiempo(h) {
    return h < 24 ? `${h}h` : `${(h / 24).toFixed(1)}d`;
}

async function loadKPIs(fechaInicio, fechaFin) {
    try {
        const kpis = await safeInvoke('get-kpis', { inicio: fechaInicio, fin: fechaFin });
        const setCard = (id, value, trend) => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('value', value);
                if (trend !== undefined) el.setAttribute('trend', trend);
            }
        };
        setCard('kpi-total', String(kpis.totalPeriodo), `${_trendArrow(kpis.trendPercent)} vs período anterior`);
        setCard('kpi-tiempo', kpis.tiempoPromedioHoras > 0 ? _fmtTiempo(kpis.tiempoPromedioHoras) : '—', kpis.tiempoPromedioHoras > 0 ? `${_trendArrow(kpis.trendTiempoPercent)} vs período anterior` : 'Sin datos');
        setCard('kpi-pendientes', String(kpis.pendientes));
    } catch (err) {
        console.error('Error cargando KPIs:', err);
    }
}

function _renderBarChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state"><p>Sin datos</p></div>'; return; }

    const labelWidth = 130;
    const max = Math.max(...data.map(d => d.cantidad), 1);
    const barH = 20, gap = 6;
    const h = data.length * (barH + gap) + 10;
    const w = 560, rightW = 36, innerW = w - labelWidth - rightW;

    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="max-height:${h+4}px;">
        ${data.map((d, i) => {
            const y = i * (barH + gap) + 4;
            const bw = Math.max((d.cantidad / max) * innerW, d.cantidad > 0 ? 12 : 0);
            const hue = (i * 47) % 360;
            return `
                <text x="${labelWidth - 6}" y="${y + barH - 5}" text-anchor="end" font-size="10" fill="var(--text-secondary)">${d.nombre}</text>
                <rect x="${labelWidth}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="hsl(${hue},45%,55%)" opacity="0.85"/>
                <text x="${labelWidth + bw + 4}" y="${y + barH - 5}" font-size="10" font-weight="600" fill="var(--text-primary)">${d.cantidad}</text>`;
        }).join('')}
    </svg>`;
}

function _renderLineChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!data || data.length < 2) { el.innerHTML = '<div class="empty-state"><p>Sin datos suficientes</p></div>'; return; }

    const sorted = [...data].reverse();
    const max = Math.max(...sorted.map(d => d.cantidad), 1);
    const w = 560, h = 160;
    const pad = { top: 16, right: 12, bottom: 28, left: 36 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const n = sorted.length;

    const pts = sorted.map((d, i) => ({
        x: pad.left + (i / (n - 1)) * plotW,
        y: pad.top + plotH - (d.cantidad / max) * plotH,
        val: d.cantidad, label: d.semana
    }));

    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const area = `${pts[0].x},${pad.top + plotH} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[n-1].x},${pad.top + plotH}`;

    const yTicks = 4;
    const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = Math.round((max / yTicks) * i);
        const y = pad.top + plotH - (val / max) * plotH;
        return `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="var(--border-color)" stroke-width="1"/>
            <text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--text-tertiary)">${val}</text>`;
    }).join('');

    const xLabels = pts.map((p, i) => {
        if (i % Math.ceil(n / 6) !== 0 && i !== n - 1) return '';
        return `<text x="${p.x}" y="${h - 4}" text-anchor="middle" font-size="8" fill="var(--text-tertiary)">${p.label.replace('W', 'S')}</text>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="max-height:${h+4}px;">
        ${yLines}
        <polygon points="${area}" fill="var(--accent-color)" opacity="0.08"/>
        <polyline points="${line}" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--accent-color)"/>`).join('')}
        ${xLabels}
    </svg>`;
}

async function loadCharts(fechaInicio, fechaFin) {
    try {
        const [porDir, tendencia] = await Promise.all([
            safeInvoke('get-actividades-por-direccion-stats', { inicio: fechaInicio, fin: fechaFin }),
            safeInvoke('get-tendencia', 12),
        ]);
        _renderBarChart('chart-direcciones', porDir);
        _renderLineChart('chart-tendencia', tendencia);
    } catch (err) {
        console.error('Error cargando charts:', err);
    }
}

export async function loadDashboard(periodo = 'mensual', inicio = null, fin = null) {
    try {
        const { fechaInicio, fechaFin } = _calcPeriodo(periodo, inicio, fin);
        if (!fechaInicio || !fechaFin) return;
        await Promise.all([loadKPIs(fechaInicio, fechaFin), loadCharts(fechaInicio, fechaFin)]);
    } catch (err) {
        console.error('Error cargando dashboard:', err);
    }
}

export function initDashboardFilters() {
    const periodoSelect = document.querySelector('#dashboard-periodo');
    const rangoFechas = document.getElementById('rango-fechas');
    const btnAplicar = document.getElementById('btn-aplicar-rango');
    const inputInicio = document.getElementById('rango-inicio');
    const inputFin = document.getElementById('rango-fin');
    const btnRefresh = document.getElementById('btn-refresh-dashboard');

    if (!periodoSelect) return;

    periodoSelect.addEventListener('change', (e) => {
        const periodo = e.detail.value;
        if (periodo === 'rango') {
            if (rangoFechas) rangoFechas.style.display = 'flex';
        } else {
            if (rangoFechas) rangoFechas.style.display = 'none';
            loadDashboard(periodo);
        }
    });

    if (btnAplicar) {
        btnAplicar.addEventListener('action', () => {
            const inicio = inputInicio?.value;
            const fin = inputFin?.value;
            if (inicio && fin) loadDashboard('rango', inicio, fin);
        });
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const periodo = periodoSelect.value || 'mensual';
            if (periodo === 'rango') {
                const inicio = inputInicio?.value;
                const fin = inputFin?.value;
                if (inicio && fin) loadDashboard('rango', inicio, fin);
                else loadDashboard('mensual');
            } else {
                loadDashboard(periodo);
            }
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
