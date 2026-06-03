import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { DatabaseAdapter } from '../database/database';

class Main {
    private window: BrowserWindow | null = null;

    constructor() {
        app.whenReady().then(() => this.initApp());
        app.on('window-all-closed', () => this.onWindowAllClosed());
        app.on('activate', () => this.onActivate());
        app.on('before-quit', () => {
            DatabaseAdapter.getInstance().close();
        });
    }

    private async initApp(): Promise<void> {
        await this.initDatabase();
        this.createWindow();
        this.setupIpcHandlers();
    }

    private async initDatabase(): Promise<void> {
        const db = DatabaseAdapter.getInstance();
        await db.connect('alcaldia.db');
        db.initTables();
        db.seedIfEmpty();
    }

    private createWindow(): void {
        this.window = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, '../preload/preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            },
        });

        this.window.loadURL(url.pathToFileURL(path.join(__dirname, '../view/index.html')).href);

        this.window.on('closed', () => {
            this.window = null;
        });
    }

    private onWindowAllClosed(): void {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    private onActivate(): void {
        if (this.window === null) {
            this.createWindow();
        }
    }

    private setupIpcHandlers(): void {
        const logHandler = (channel: string, fn: (...args: any[]) => any) => {
            return async (_event: any, ...args: any[]) => {
                const start = Date.now();
                console.log(`[IPC:IN] ${channel}`, args.length === 1 ? args[0] : args);
                try {
                    const result = await fn(...args);
                    console.log(`[IPC:OK] ${channel} (${Date.now() - start}ms)`, result);
                    return result;
                } catch (e: any) {
                    console.error(`[IPC:ERR] ${channel} (${Date.now() - start}ms)`, e.message);
                    console.error(e.stack);
                    return undefined;
                }
            };
        };

        ipcMain.handle('get-direcciones', logHandler('get-direcciones', () => {
            return DatabaseAdapter.getInstance().getDirecciones();
        }));

        ipcMain.handle('add-direccion', logHandler('add-direccion', (nombre: string) => {
            const db = DatabaseAdapter.getInstance();
            if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
            const id = db.addDireccion(nombre);
            console.log(`[DB] addDireccion -> id=${id}, nombre="${nombre}"`);
            return id;
        }));

        ipcMain.handle('update-direccion', logHandler('update-direccion', (data: { id: string; nombre: string }) => {
            console.log(`[DB] updateDireccion -> id=${data.id}, nombre="${data.nombre}"`);
            DatabaseAdapter.getInstance().updateDireccion(data.id, data.nombre);
        }));

        ipcMain.handle('delete-direccion', logHandler('delete-direccion', (id: string) => {
            console.log(`[DB] deleteDireccion (soft) -> id=${id}`);
            DatabaseAdapter.getInstance().deleteDireccion(id);
        }));

        ipcMain.handle('get-incidencias', logHandler('get-incidencias', () => {
            return DatabaseAdapter.getInstance().getIncidencias();
        }));

        ipcMain.handle('add-incidencia', logHandler('add-incidencia', (nombre: string) => {
            const db = DatabaseAdapter.getInstance();
            if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
            const id = db.addIncidencia(nombre);
            console.log(`[DB] addIncidencia -> id=${id}, nombre="${nombre}"`);
            return id;
        }));

        ipcMain.handle('update-incidencia', logHandler('update-incidencia', (data: { id: string; nombre: string }) => {
            console.log(`[DB] updateIncidencia -> id=${data.id}, nombre="${data.nombre}"`);
            DatabaseAdapter.getInstance().updateIncidencia(data.id, data.nombre);
        }));

        ipcMain.handle('delete-incidencia', logHandler('delete-incidencia', (id: string) => {
            console.log(`[DB] deleteIncidencia (soft) -> id=${id}`);
            DatabaseAdapter.getInstance().deleteIncidencia(id);
        }));

        ipcMain.handle('get-actividades', logHandler('get-actividades', () => {
            const acts = DatabaseAdapter.getInstance().getActividades();
            console.log(`[DB] getActividades -> ${acts.length} registros`);
            return acts;
        }));

        ipcMain.handle('add-actividad', logHandler('add-actividad', (data: { direccionId: string; incidenciaId: string; descripcion: string }) => {
            console.log(`[DB] addActividad -> dirId=${data.direccionId}, incId=${data.incidenciaId}, desc="${data.descripcion}"`);
            return DatabaseAdapter.getInstance().addActividad(data.direccionId, data.incidenciaId, data.descripcion);
        }));

        ipcMain.handle('update-actividad', logHandler('update-actividad', (data: { id: string; direccionId: string; incidenciaId: string; descripcion: string }) => {
            console.log(`[DB] updateActividad -> id=${data.id}`);
            DatabaseAdapter.getInstance().updateActividad(data.id, data.direccionId, data.incidenciaId, data.descripcion);
        }));

        ipcMain.handle('delete-actividad', logHandler('delete-actividad', (id: string) => {
            console.log(`[DB] deleteActividad (soft) -> id=${id}`);
            DatabaseAdapter.getInstance().deleteActividad(id);
        }));

        ipcMain.handle('get-stats', logHandler('get-stats', () => {
            const db = DatabaseAdapter.getInstance();
            db.recomputeMetrics();
            return db.getStats();
        }));

        ipcMain.handle('get-actividades-por-direccion', logHandler('get-actividades-por-direccion', (direccionId: string) => {
            return DatabaseAdapter.getInstance().getActividadesPorDireccion(direccionId);
        }));

        ipcMain.handle('get-metrics-history', logHandler('get-metrics-history', () => {
            return DatabaseAdapter.getInstance().getMetricsHistory();
        }));

        ipcMain.handle('get-actividades-rango', logHandler('get-actividades-rango', (args: { inicio: string; fin: string }) => {
            return DatabaseAdapter.getInstance().getActividadesPorRango(args.inicio, args.fin);
        }));
    }
}

new Main();