import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

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
        `);
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

        this.db.run(`
            CREATE TABLE IF NOT EXISTS actividad_log (
                id TEXT PRIMARY KEY,
                actividad_id TEXT NOT NULL,
                campo TEXT NOT NULL,
                valor_anterior TEXT,
                valor_nuevo TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (actividad_id) REFERENCES actividades(id)
            )
        `);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividad_log_actividad ON actividad_log(actividad_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_actividad_log_created ON actividad_log(created_at)`);

        this._migrate();
        this.save();
    }

    private _migrate(): void {
        try {
            const cols = this.db!.exec("PRAGMA table_info('actividades')")[0]?.values.map((v: any) => v[1] as string) || [];
            if (!cols.includes('estado')) this.db!.run("ALTER TABLE actividades ADD COLUMN estado TEXT DEFAULT 'pendiente'");
            if (!cols.includes('prioridad')) this.db!.run("ALTER TABLE actividades ADD COLUMN prioridad TEXT DEFAULT 'media'");
            if (!cols.includes('resolved_at')) this.db!.run("ALTER TABLE actividades ADD COLUMN resolved_at TEXT");
            
            if (!cols.includes('tipo_equipo')) this.db!.run("ALTER TABLE actividades ADD COLUMN tipo_equipo TEXT DEFAULT 'general'");
            if (!cols.includes('datos_tecnicos')) this.db!.run("ALTER TABLE actividades ADD COLUMN datos_tecnicos TEXT");            
        } catch (e) {
            console.warn('[DB] Migration warning:', e);
        }
    }

    public seedIfEmpty(): void {
        if (!this.db) return;

        const dirCount = this.db.exec('SELECT COUNT(*) as c FROM direcciones');
        const countDir = (dirCount[0]?.values[0]?.[0] as number) || 0;

        if (countDir === 0) {
            const direcciones = [
                'Despacho del Alcalde',
                'Direccion General',
                'Catastro',
                'Hacienda Municipal',
                'Administracion',
                'Compras',
                'Tesoreria',
                'Contabilidad',
                'Bienes Municipales',
                'Presupuesto',
                'Contrataciones',
                'Prensa',
                'Desarrollo Urbano',
                'Ingenieria Municipal',
                'Planificacion',
                'Recursos Humanos',
                'Informatica',
                'Servicios Publicos',
                'Desarrollo Social',
                'Consejo Municipal',
                'Sindicatura',
                'Seguridad Ciudadana',
                'OAC',
                'Inmuvin',
                'Fondemin',
                'Iamdeim',
                'Cejarca',
                'Iapatmi',
                'Cllp',
                'Registro Civil',
                'Registro Civil del Hospital',
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
                'Sistema Sisap',
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
}
