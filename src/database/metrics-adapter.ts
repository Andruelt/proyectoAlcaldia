import { DatabaseAdapter } from './database';

export interface Stats {
    totalDirecciones: number;
    totalIncidencias: number;
    totalActividades: number;
    actividadesRecientes: number;
    chartData: { labels: string[]; values: number[] };
}

export interface MetricEntry {
    fecha: string;
    direcciones_activas: number;
    incidencias_activas: number;
    actividades_total: number;
    actividades_7d: number;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface CountRow { c: number }
interface ChartRow { mes: string; cantidad: number }

export class MetricsAdapter {
    constructor(private db: DatabaseAdapter) {}

    public getStats(): Stats {
        const totalDirecciones = this.db.get<CountRow>(
            'SELECT COUNT(*) as c FROM direcciones WHERE deleted_at IS NULL'
        )?.c || 0;

        const totalIncidencias = this.db.get<CountRow>(
            'SELECT COUNT(*) as c FROM incidencias WHERE deleted_at IS NULL'
        )?.c || 0;

        const totalActividades = this.db.get<CountRow>(
            'SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL'
        )?.c || 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const actividadesRecientes = this.db.get<CountRow>(
            'SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND created_at >= ?',
            [sevenDaysAgo]
        )?.c || 0;

        const chart = this.db.all<ChartRow>(`
            SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as cantidad
            FROM actividades WHERE deleted_at IS NULL
            GROUP BY mes ORDER BY mes DESC LIMIT 6
        `);

        const chartLabels: string[] = [];
        const chartValues: number[] = [];
        chart.reverse().forEach(r => {
            const [year, month] = r.mes.split('-');
            const monthIdx = parseInt(month, 10) - 1;
            chartLabels.push(`${MESES[monthIdx] || month} ${year.slice(2)}`);
            chartValues.push(r.cantidad);
        });

        return {
            totalDirecciones,
            totalIncidencias,
            totalActividades,
            actividadesRecientes,
            chartData: { labels: chartLabels, values: chartValues },
        };
    }

    public recomputeMetrics(): void {
        const stats = this.getStats();
        const hoy = new Date().toISOString().split('T')[0];
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        this.db.run('DELETE FROM metricas WHERE fecha = ?', [hoy]);
        this.db.run(
            'INSERT INTO metricas (id, fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, hoy, stats.totalDirecciones, stats.totalIncidencias, stats.totalActividades, stats.actividadesRecientes, now]
        );
        this.db.save();
    }

    public getHistory(): MetricEntry[] {
        return this.db.all<MetricEntry>(
            'SELECT fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d FROM metricas ORDER BY fecha ASC LIMIT 30'
        );
    }
}
