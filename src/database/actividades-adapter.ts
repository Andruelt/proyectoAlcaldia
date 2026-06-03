import { DatabaseAdapter } from './database';

export interface Actividad {
    id: string;
    direccion: string;
    incidencia: string;
    descripcion: string;
    created_at: string;
}

export interface ActividadCompleta extends Actividad {
    direccion_id: string;
    incidencia_id: string;
    estado: string;
    prioridad: string;
    resolved_at: string | null;
}

export interface AnalyticsRow {
    incidencia: string;
    cantidad: number;
}

export interface KPIs {
    totalPeriodo: number;
    totalPeriodoAnterior: number;
    trendPercent: number;
    pendientes: number;
    criticos: number;
    tiempoPromedioHoras: number;
    tiempoPromedioAnterior: number;
    trendTiempoPercent: number;
}

interface StatsRow {
    nombre: string;
    cantidad: number;
}

interface TendenciaRow {
    semana: string;
    cantidad: number;
}

export class ActividadesAdapter {
    constructor(private db: DatabaseAdapter) {}

    public getAll(): ActividadCompleta[] {
        return this.db.all<ActividadCompleta>(`
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion,
                   a.created_at, a.direccion_id, a.incidencia_id, a.estado, a.prioridad, a.resolved_at
            FROM actividades a
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL
            ORDER BY a.created_at DESC
        `);
    }

    public add(direccionId: string, incidenciaId: string, descripcion: string,
               estado = 'pendiente', prioridad = 'media'): string {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.db.run(
            'INSERT INTO actividades (id, direccion_id, incidencia_id, descripcion, created_at, updated_at, estado, prioridad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, direccionId, incidenciaId, descripcion, now, now, estado, prioridad]
        );
        this.db.save();
        return id;
    }

    public update(id: string, direccionId: string, incidenciaId: string, descripcion: string): void {
        const now = new Date().toISOString();
        const old = this.db.get<{ estado: string; prioridad: string }>('SELECT estado, prioridad FROM actividades WHERE id = ?', [id]);
        this.db.run(
            'UPDATE actividades SET direccion_id = ?, incidencia_id = ?, descripcion = ?, updated_at = ? WHERE id = ?',
            [direccionId, incidenciaId, descripcion, now, id]
        );
        this.db.save();
    }

    public updateEstado(id: string, estado: string): void {
        const old = this.db.get<{ estado: string }>('SELECT estado FROM actividades WHERE id = ?', [id]);
        const now = new Date().toISOString();
        this.db.run('UPDATE actividades SET estado = ?, updated_at = ? WHERE id = ?', [estado, now, id]);
        if (estado === 'completado') {
            this.db.run('UPDATE actividades SET resolved_at = ? WHERE id = ? AND resolved_at IS NULL', [now, id]);
        }
        if (old) this._log(id, 'estado', old.estado, estado);
        this.db.save();
    }

    public updatePrioridad(id: string, prioridad: string): void {
        const old = this.db.get<{ prioridad: string }>('SELECT prioridad FROM actividades WHERE id = ?', [id]);
        const now = new Date().toISOString();
        this.db.run('UPDATE actividades SET prioridad = ?, updated_at = ? WHERE id = ?', [prioridad, now, id]);
        if (old) this._log(id, 'prioridad', old.prioridad, prioridad);
        this.db.save();
    }

    public delete(id: string): void {
        const now = new Date().toISOString();
        this.db.run('UPDATE actividades SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.db.save();
    }

    public getPorDireccion(direccionId?: string): Actividad[] {
        const base = `
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion, a.created_at
            FROM actividades a
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL`;
        if (direccionId) {
            return this.db.all<Actividad>(`${base} AND a.direccion_id = ? ORDER BY a.created_at DESC`, [direccionId]);
        }
        return this.db.all<Actividad>(`${base} ORDER BY a.created_at DESC`);
    }

    public getAnalyticsPorPeriodo(inicio: string): AnalyticsRow[] {
        return this.db.all<AnalyticsRow>(`
            SELECT i.nombre as incidencia, COUNT(*) as cantidad
            FROM actividades a
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL AND a.created_at >= ?
            GROUP BY a.incidencia_id ORDER BY cantidad DESC
        `, [inicio]);
    }

    public getKPIs(inicio: string, fin: string): KPIs {
        const durMs = new Date(fin).getTime() - new Date(inicio).getTime();
        const inicioAnterior = new Date(new Date(inicio).getTime() - durMs).toISOString().split('T')[0];

        const totalPeriodo = this.db.get<{ c: number }>(
            'SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND created_at >= ? AND created_at < ?',
            [inicio, fin]
        )?.c || 0;

        const totalPeriodoAnterior = this.db.get<{ c: number }>(
            'SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND created_at >= ? AND created_at < ?',
            [inicioAnterior, inicio]
        )?.c || 0;

        const pendientes = this.db.get<{ c: number }>(
            "SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND estado = 'pendiente'"
        )?.c || 0;

        const criticos = this.db.get<{ c: number }>(
            "SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND prioridad = 'critica' AND estado != 'completado'"
        )?.c || 0;

        const avgRes = this.db.get<{ avg: number | null }>(
            "SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg FROM actividades WHERE deleted_at IS NULL AND estado = 'completado' AND resolved_at IS NOT NULL"
        )?.avg || 0;

        const avgResAnterior = this.db.get<{ avg: number | null }>(
            "SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg FROM actividades WHERE deleted_at IS NULL AND estado = 'completado' AND resolved_at IS NOT NULL AND created_at >= ? AND created_at < ?",
            [inicioAnterior, inicio]
        )?.avg || 0;

        const trendPercent = totalPeriodoAnterior > 0 ? Math.round((totalPeriodo - totalPeriodoAnterior) / totalPeriodoAnterior * 100) : 0;
        const trendTiempoPercent = avgResAnterior > 0 ? Math.round((avgRes - avgResAnterior) / avgResAnterior * 100) : 0;

        return {
            totalPeriodo, totalPeriodoAnterior, trendPercent,
            pendientes, criticos,
            tiempoPromedioHoras: Math.round(avgRes * 10) / 10,
            tiempoPromedioAnterior: Math.round(avgResAnterior * 10) / 10,
            trendTiempoPercent
        };
    }

    public getActividadesPorEstado(): StatsRow[] {
        return this.db.all<StatsRow>(
            'SELECT estado as nombre, COUNT(*) as cantidad FROM actividades WHERE deleted_at IS NULL GROUP BY estado ORDER BY cantidad DESC'
        );
    }

    public getActividadesPorPrioridad(): StatsRow[] {
        return this.db.all<StatsRow>(
            'SELECT prioridad as nombre, COUNT(*) as cantidad FROM actividades WHERE deleted_at IS NULL GROUP BY prioridad ORDER BY cantidad DESC'
        );
    }

    public getActividadesPorDireccionStats(inicio: string, fin: string): StatsRow[] {
        return this.db.all<StatsRow>(`
            SELECT d.nombre, COUNT(*) as cantidad
            FROM actividades a
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            WHERE a.deleted_at IS NULL AND a.created_at >= ? AND a.created_at < ?
            GROUP BY a.direccion_id ORDER BY cantidad DESC
        `, [inicio, fin]);
    }

    public getTendencia(semanas: number): TendenciaRow[] {
        return this.db.all<TendenciaRow>(`
            SELECT strftime('%Y-W%W', created_at) as semana, COUNT(*) as cantidad
            FROM actividades WHERE deleted_at IS NULL
            GROUP BY semana ORDER BY semana DESC LIMIT ?
        `, [semanas]);
    }

    public getActividadConLog(id: string): { actividad: ActividadCompleta | undefined; logs: any[] } {
        const actividad = this.db.get<ActividadCompleta>(`
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion,
                   a.created_at, a.direccion_id, a.incidencia_id, a.estado, a.prioridad, a.resolved_at
            FROM actividades a
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.id = ? AND a.deleted_at IS NULL
        `, [id]);
        const logs = this.db.all<any>(
            'SELECT campo, valor_anterior, valor_nuevo, created_at FROM actividad_log WHERE actividad_id = ? ORDER BY created_at ASC',
            [id]
        );
        return { actividad, logs };
    }

    public getPorRango(inicio: string, fin: string): Record<string, ActividadCompleta[]> {
        const rows = this.db.all<ActividadCompleta>(`
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion,
                   a.created_at, a.direccion_id, a.incidencia_id, a.estado, a.prioridad, a.resolved_at
            FROM actividades a
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL AND a.created_at >= ? AND a.created_at < ?
            ORDER BY a.created_at DESC
        `, [inicio, fin]);

        const grouped: Record<string, ActividadCompleta[]> = {};
        for (const row of rows) {
            const fecha = row.created_at.split('T')[0];
            if (!grouped[fecha]) grouped[fecha] = [];
            grouped[fecha].push(row);
        }
        return grouped;
    }

    private _log(actividadId: string, campo: string, valorAnterior: string, valorNuevo: string): void {
        this.db.run(
            'INSERT INTO actividad_log (id, actividad_id, campo, valor_anterior, valor_nuevo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), actividadId, campo, valorAnterior, valorNuevo, new Date().toISOString()]
        );
    }
}
