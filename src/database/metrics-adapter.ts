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

interface ChartRow {
    mes: string;
    cantidad: number;
}

export class MetricsAdapter {
    constructor(private db: DatabaseAdapter) {}

    public getStats(): Stats {
        const conn = this.db.getConnection();
        if (!conn) {
            return { totalDirecciones: 0, totalIncidencias: 0, totalActividades: 0, actividadesRecientes: 0, chartData: { labels: [], values: [] } };
        }

        const countDirs = conn.exec('SELECT COUNT(*) as c FROM direcciones WHERE deleted_at IS NULL');
        const totalDirecciones = (countDirs[0]?.values[0]?.[0] as number) || 0;

        const countIncs = conn.exec('SELECT COUNT(*) as c FROM incidencias WHERE deleted_at IS NULL');
        const totalIncidencias = (countIncs[0]?.values[0]?.[0] as number) || 0;

        const countActs = conn.exec('SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL');
        const totalActividades = (countActs[0]?.values[0]?.[0] as number) || 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recent = conn.exec(`SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND created_at >= '${sevenDaysAgo}'`);
        const actividadesRecientes = (recent[0]?.values[0]?.[0] as number) || 0;

        const chart = this.db.all<ChartRow>(`
            SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as cantidad
            FROM actividades WHERE deleted_at IS NULL
            GROUP BY mes ORDER BY mes DESC LIMIT 6
        `);

        const chartLabels: string[] = [];
        const chartValues: number[] = [];
        chart.reverse().forEach(r => {
            const [year, month] = r.mes.split('-');
            const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            chartLabels.push(`${meses[parseInt(month) - 1]} ${year.slice(2)}`);
            chartValues.push(r.cantidad);
        });

        return { totalDirecciones, totalIncidencias, totalActividades, actividadesRecientes, chartData: { labels: chartLabels, values: chartValues } };
    }

    public recomputeMetrics(): void {
        const conn = this.db.getConnection();
        if (!conn) return;

        const hoy = new Date().toISOString().split('T')[0];
        const stats = this.getStats();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        conn.run('DELETE FROM metricas WHERE fecha = ?', [hoy]);
        this.db.run(
            'INSERT INTO metricas (id, fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, hoy, stats.totalDirecciones, stats.totalIncidencias, stats.totalActividades, stats.actividadesRecientes, now]
        );
        this.db.save();
    }

    public getHistory(): MetricEntry[] {
        return this.db.all<MetricEntry>('SELECT fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d FROM metricas ORDER BY fecha ASC LIMIT 30');
    }
}
