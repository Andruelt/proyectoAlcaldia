import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// todo: mover funciones de base de datos separadas por tipos para evitar el crecimiento descontrolado de esta clase, por ejemplo: DireccionesAdapter, IncidenciasAdapter, ActividadesAdapter, MetricsAdapter, etc. y que DatabaseAdapter solo se encargue de la conexión y funciones genéricas como run, get, all, etc.

export class DatabaseAdapter {
    private db: SqlJsDatabase | null = null;
    private static instance: DatabaseAdapter | null = null;
    private dbPath: string = '';
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): DatabaseAdapter {
        if (!DatabaseAdapter.instance) {
            DatabaseAdapter.instance = new DatabaseAdapter();
        }
        return DatabaseAdapter.instance;
    }

    public async connect(dbName: string = 'database.db'): Promise<void> {
        if (this.initialized) return;

        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, dbName);

        const SQL = await initSqlJs();

        let data: Buffer | undefined;
        if (fs.existsSync(this.dbPath)) {
            data = fs.readFileSync(this.dbPath);
        }

        this.db = data ? new SQL.Database(data) : new SQL.Database();
        this.db.run('PRAGMA foreign_keys = ON');
        this.save();
        this.initialized = true;
    }

    public getConnection(): SqlJsDatabase | null {
        return this.db;
    }

    public run(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        this.db.run(sql, params);
        const lastId = this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number || 0;
        const changes = this.db.getRowsModified();
        return { lastInsertRowid: lastId, changes };
    }

    public get<T>(sql: string, params: unknown[] = []): T | undefined {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row as T;
        }
        stmt.free();
        return undefined;
    }

    public all<T>(sql: string, params: unknown[] = []): T[] {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        const results: T[] = [];
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
            results.push(stmt.getAsObject() as T);
        }
        stmt.free();
        return results;
    }

    public save(): void {
        if (!this.db || !this.dbPath) return;
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
    }

    public close(): void {
        if (this.db) {
            this.save();
            this.db.close();
            this.db = null;
        }
        this.initialized = false;
    }

    public initTables(): void {
        if (!this.db) return;
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS direcciones (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                deleted_at TEXT
            )
        `);
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS incidencias (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                deleted_at TEXT
            )
        `);
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS actividades (
                id TEXT PRIMARY KEY,
                direccion_id TEXT NOT NULL,
                incidencia_id TEXT NOT NULL,
                descripcion TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                deleted_at TEXT,
                FOREIGN KEY (direccion_id) REFERENCES direcciones(id),
                FOREIGN KEY (incidencia_id) REFERENCES incidencias(id)
            )
        `        );
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividades_direccion ON actividades(direccion_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividades_incidencia ON actividades(incidencia_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividades_created ON actividades(created_at)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividades_deleted ON actividades(deleted_at)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_direcciones_deleted ON direcciones(deleted_at)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_incidencias_deleted ON incidencias(deleted_at)`);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS metricas (
                id TEXT PRIMARY KEY,
                fecha TEXT NOT NULL,
                direcciones_activas INTEGER DEFAULT 0,
                incidencias_activas INTEGER DEFAULT 0,
                actividades_total INTEGER DEFAULT 0,
                actividades_7d INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        this.save();
    }

    public seedIfEmpty(): void {
        if (!this.db) return;

        const dirCount = this.db.exec('SELECT COUNT(*) as c FROM direcciones');
        const countDir = (dirCount[0]?.values[0]?.[0] as number) || 0;

        if (countDir === 0) {
            const direcciones = [
                'Despacho del alcade',
                'Direccion general',
                'Castastro',
                'Hacienda municipal',
                'Administracion',
                'Compras',
                'Tesoreia',
                'Contabilidad',
                'Bienes municipales',
                'Presupuesto',
                'Contrataciones',
                'Prensa',
                'Desarrrolo urbano',
                'Ingenieria municipal',
                'Planificacion',
                'Recursos humanos',
                'Informatica',
                'Servicios publicos',
                'Desarrollo social',
                'Consejo municipal',
                'Sindicatura',
                'Seguridad ciudadana',
                'OAC',
                'Inmuvin',
                'Fondemin',
                'Iamdeim',
                'Cejarca',
                'Iapatmi',
                'Cllp',
                'Registro civil',
                'Registro civil del hospital',
                'Otros'
            ];
            const now = new Date().toISOString();
            for (const nombre of direcciones) {
                this.db.run('INSERT INTO direcciones (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), nombre, now, now]);
            }
        }

        const incCount = this.db.exec('SELECT COUNT(*) as c FROM incidencias');
        const countInc = (incCount[0]?.values[0]?.[0] as number) || 0;

        if (countInc === 0) {
            const incidencias = [
                'Instalacion de equipo',
                'Reparacion de equipo',
                'Mantenimiento de equipo',
                'Soporte tecnico o asesorias',
                'Instalacion de software/Configuracion de equipo',
                'Sistema sisap',
                'Sistema Siap',
                'Red e internet',
                'Telefonia y comunicaciones',
                'CCTV',
                'Otros',
                'Soporte tecnico - Reparaciones o Mantenimiento',
                'Soporte tecnico - Consultas o asesoria'
            ];
            const now = new Date().toISOString();
            for (const nombre of incidencias) {
                this.db.run('INSERT INTO incidencias (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), nombre, now, now]);
            }
        }

        this.save();
    }

    public getDirecciones(): { id: string; nombre: string }[] {
        if (!this.db) return [];
        return this.all('SELECT id, nombre FROM direcciones WHERE deleted_at IS NULL ORDER BY created_at DESC');
    }

    public addDireccion(nombre: string): string {
        if (!this.db) return '';
        const trimmed = nombre.trim();
        if (!trimmed) throw new Error('El nombre de la dirección no puede estar vacío');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.run('INSERT INTO direcciones (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, trimmed, now, now]);
        this.save();
        return id;
    }

    public getIncidencias(): { id: string; nombre: string }[] {
        if (!this.db) return [];
        return this.all('SELECT id, nombre FROM incidencias WHERE deleted_at IS NULL ORDER BY created_at DESC');
    }

    public addIncidencia(nombre: string): string {
        if (!this.db) return '';
        const trimmed = nombre.trim();
        if (!trimmed) throw new Error('El nombre de la incidencia no puede estar vacío');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.run('INSERT INTO incidencias (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, trimmed, now, now]);
        this.save();
        return id;
    }

    public getActividades(): { id: string; direccion: string; incidencia: string; descripcion: string; created_at: string; direccion_id: string; incidencia_id: string }[] {
        if (!this.db) return [];
        return this.all(`
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion, a.created_at, a.direccion_id, a.incidencia_id
            FROM actividades a 
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL 
            ORDER BY a.created_at DESC
        `);
    }

    public addActividad(direccionId: string, incidenciaId: string, descripcion: string): string {
        if (!this.db) return '';
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.run(
            'INSERT INTO actividades (id, direccion_id, incidencia_id, descripcion, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, direccionId, incidenciaId, descripcion, now, now]
        );
        this.save();
        return id;
    }

    public updateDireccion(id: string, nombre: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE direcciones SET nombre = ?, updated_at = ? WHERE id = ?', [nombre, now, id]);
        this.save();
    }

    public deleteDireccion(id: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE direcciones SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.save();
    }

    public updateIncidencia(id: string, nombre: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE incidencias SET nombre = ?, updated_at = ? WHERE id = ?', [nombre, now, id]);
        this.save();
    }

    public deleteIncidencia(id: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE incidencias SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.save();
    }

    public updateActividad(id: string, direccionId: string, incidenciaId: string, descripcion: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE actividades SET direccion_id = ?, incidencia_id = ?, descripcion = ?, updated_at = ? WHERE id = ?', [direccionId, incidenciaId, descripcion, now, id]);
        this.save();
    }

    public deleteActividad(id: string): void {
        if (!this.db) return;
        const now = new Date().toISOString();
        this.run('UPDATE actividades SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.save();
    }

    public getStats(): {
        totalDirecciones: number;
        totalIncidencias: number;
        totalActividades: number;
        actividadesRecientes: number;
        chartData: { labels: string[]; values: number[] };
    } {
        if (!this.db) {
            return { totalDirecciones: 0, totalIncidencias: 0, totalActividades: 0, actividadesRecientes: 0, chartData: { labels: [], values: [] } };
        }

        const countDirs = this.db.exec('SELECT COUNT(*) as c FROM direcciones WHERE deleted_at IS NULL');
        const totalDirecciones = (countDirs[0]?.values[0]?.[0] as number) || 0;

        const countIncs = this.db.exec('SELECT COUNT(*) as c FROM incidencias WHERE deleted_at IS NULL');
        const totalIncidencias = (countIncs[0]?.values[0]?.[0] as number) || 0;

        const countActs = this.db.exec('SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL');
        const totalActividades = (countActs[0]?.values[0]?.[0] as number) || 0;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recent = this.db.exec(`SELECT COUNT(*) as c FROM actividades WHERE deleted_at IS NULL AND created_at >= '${sevenDaysAgo}'`);
        const actividadesRecientes = (recent[0]?.values[0]?.[0] as number) || 0;

        const chart = this.all<{ mes: string; cantidad: number }>(`
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

    public getActividadesPorDireccion(direccionId?: string): { id: string; direccion: string; incidencia: string; descripcion: string; created_at: string }[] {
        if (!this.db) return [];
        if (direccionId) {
            return this.all(`
                SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion, a.created_at 
                FROM actividades a 
                JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
                JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
                WHERE a.deleted_at IS NULL AND a.direccion_id = ?
                ORDER BY a.created_at DESC
            `, [direccionId]);
        }
        return this.getActividades();
    }

    public recomputeMetrics(): void {
        if (!this.db) return;
        const hoy = new Date().toISOString().split('T')[0];
        const stats = this.getStats();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        this.db.run(`DELETE FROM metricas WHERE fecha = ?`, [hoy]);
        this.run(
            'INSERT INTO metricas (id, fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, hoy, stats.totalDirecciones, stats.totalIncidencias, stats.totalActividades, stats.actividadesRecientes, now]
        );
        this.save();
    }

    public getMetricsHistory(): { fecha: string; direcciones_activas: number; incidencias_activas: number; actividades_total: number; actividades_7d: number }[] {
        if (!this.db) return [];
        return this.all('SELECT fecha, direcciones_activas, incidencias_activas, actividades_total, actividades_7d FROM metricas ORDER BY fecha ASC LIMIT 30');
    }

    public getActividadesPorRango(inicio: string, fin: string): Record<string, { id: string; direccion: string; incidencia: string; descripcion: string; created_at: string; direccion_id: string; incidencia_id: string }[]> {
        if (!this.db) return {};
        const rows = this.all<{ id: string; direccion: string; incidencia: string; descripcion: string; created_at: string; direccion_id: string; incidencia_id: string }>(`
            SELECT a.id, d.nombre as direccion, i.nombre as incidencia, a.descripcion, a.created_at, a.direccion_id, a.incidencia_id
            FROM actividades a 
            JOIN direcciones d ON a.direccion_id = d.id AND d.deleted_at IS NULL
            JOIN incidencias i ON a.incidencia_id = i.id AND i.deleted_at IS NULL
            WHERE a.deleted_at IS NULL AND a.created_at >= ? AND a.created_at < ?
            ORDER BY a.created_at DESC
        `, [inicio, fin]);

        const grouped: Record<string, typeof rows> = {};
        for (const row of rows) {
            const fecha = row.created_at.split('T')[0];
            if (!grouped[fecha]) grouped[fecha] = [];
            grouped[fecha].push(row);
        }
        return grouped;
    }
}