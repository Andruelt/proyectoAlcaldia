import { app, BrowserWindow, ipcMain, dialog, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { DatabaseAdapter } from '../database/database';
import { DireccionesAdapter } from '../database/direcciones-adapter';
import { IncidenciasAdapter } from '../database/incidencias-adapter';
import { ActividadesAdapter } from '../database/actividades-adapter';
import { MetricsAdapter } from '../database/metrics-adapter';
import { generatePdf, generateWord, generateInformeTecnico, generateInformeTecnicoPdf } from './report-export';

class Main {
    private window: BrowserWindow | null = null;
    private direcciones!: DireccionesAdapter;
    private incidencias!: IncidenciasAdapter;
    private actividades!: ActividadesAdapter;
    private metrics!: MetricsAdapter;

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

        this.direcciones = new DireccionesAdapter(db);
        this.incidencias = new IncidenciasAdapter(db);
        this.actividades = new ActividadesAdapter(db);
        this.metrics = new MetricsAdapter(db);
    }

    private createWindow(): void {
        this.window = new BrowserWindow({
            width: 1200,
            height: 800,
            frame: false,
            titleBarStyle: 'hidden',
            transparent: true,
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
            return this.direcciones.getAll();
        }));

        ipcMain.handle('add-direccion', logHandler('add-direccion', (nombre: string) => {
            if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
            const id = this.direcciones.add(nombre);
            console.log(`[DB] addDireccion -> id=${id}, nombre="${nombre}"`);
            return id;
        }));

        ipcMain.handle('update-direccion', logHandler('update-direccion', (data: { id: string; nombre: string }) => {
            console.log(`[DB] updateDireccion -> id=${data.id}, nombre="${data.nombre}"`);
            this.direcciones.update(data.id, data.nombre);
        }));

        ipcMain.handle('delete-direccion', logHandler('delete-direccion', (id: string) => {
            console.log(`[DB] deleteDireccion (soft) -> id=${id}`);
            this.direcciones.delete(id);
        }));

        ipcMain.handle('get-incidencias', logHandler('get-incidencias', () => {
            return this.incidencias.getAll();
        }));

        ipcMain.handle('add-incidencia', logHandler('add-incidencia', (nombre: string) => {
            if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
            const id = this.incidencias.add(nombre);
            console.log(`[DB] addIncidencia -> id=${id}, nombre="${nombre}"`);
            return id;
        }));

        ipcMain.handle('update-incidencia', logHandler('update-incidencia', (data: { id: string; nombre: string }) => {
            console.log(`[DB] updateIncidencia -> id=${data.id}, nombre="${data.nombre}"`);
            this.incidencias.update(data.id, data.nombre);
        }));

        ipcMain.handle('delete-incidencia', logHandler('delete-incidencia', (id: string) => {
            console.log(`[DB] deleteIncidencia (soft) -> id=${id}`);
            this.incidencias.delete(id);
        }));

        ipcMain.handle('get-actividades', logHandler('get-actividades', () => {
            const acts = this.actividades.getAll();
            console.log(`[DB] getActividades -> ${acts.length} registros`);
            return acts;
        }));

        ipcMain.handle('add-actividad', logHandler('add-actividad', (data: { direccionId: string; incidenciaId: string; descripcion: string; estado?: string; prioridad?: string }) => {
            console.log(`[DB] addActividad -> dirId=${data.direccionId}, incId=${data.incidenciaId}`);
            return this.actividades.add(data.direccionId, data.incidenciaId, data.descripcion, data.estado, data.prioridad);
        }));

        ipcMain.handle('update-actividad', logHandler('update-actividad', (data: { id: string; direccionId: string; incidenciaId: string; descripcion: string }) => {
            console.log(`[DB] updateActividad -> id=${data.id}`);
            this.actividades.update(data.id, data.direccionId, data.incidenciaId, data.descripcion);
        }));

        ipcMain.handle('delete-actividad', logHandler('delete-actividad', (id: string) => {
            console.log(`[DB] deleteActividad (soft) -> id=${id}`);
            this.actividades.delete(id);
        }));

        ipcMain.handle('update-actividad-estado', logHandler('update-actividad-estado', (data: { id: string; estado: string }) => {
            this.actividades.updateEstado(data.id, data.estado);
        }));

        ipcMain.handle('update-actividad-prioridad', logHandler('update-actividad-prioridad', (data: { id: string; prioridad: string }) => {
            this.actividades.updatePrioridad(data.id, data.prioridad);
        }));

        ipcMain.handle('get-stats', logHandler('get-stats', () => {
            this.metrics.recomputeMetrics();
            return this.metrics.getStats();
        }));

        ipcMain.handle('get-actividades-por-direccion', logHandler('get-actividades-por-direccion', (direccionId: string) => {
            return this.actividades.getPorDireccion(direccionId);
        }));

        ipcMain.handle('get-metrics-history', logHandler('get-metrics-history', () => {
            return this.metrics.getHistory();
        }));

        ipcMain.handle('get-actividades-rango', logHandler('get-actividades-rango', (args: { inicio: string; fin: string }) => {
            return this.actividades.getPorRango(args.inicio, args.fin);
        }));

        ipcMain.handle('get-analytics', logHandler('get-analytics', (inicio: string) => {
            return this.actividades.getAnalyticsPorPeriodo(inicio);
        }));

        ipcMain.handle('get-kpis', logHandler('get-kpis', (args: { inicio: string; fin: string }) => {
            return this.actividades.getKPIs(args.inicio, args.fin);
        }));

        ipcMain.handle('get-actividades-por-estado', logHandler('get-actividades-por-estado', () => {
            return this.actividades.getActividadesPorEstado();
        }));

        ipcMain.handle('get-actividades-por-prioridad', logHandler('get-actividades-por-prioridad', () => {
            return this.actividades.getActividadesPorPrioridad();
        }));

        ipcMain.handle('get-actividades-por-direccion-stats', logHandler('get-actividades-por-direccion-stats', (args: { inicio: string; fin: string }) => {
            return this.actividades.getActividadesPorDireccionStats(args.inicio, args.fin);
        }));

        ipcMain.handle('get-tendencia', logHandler('get-tendencia', (semanas: number) => {
            return this.actividades.getTendencia(semanas);
        }));

        ipcMain.handle('get-actividad-con-log', logHandler('get-actividad-con-log', (id: string) => {
            return this.actividades.getActividadConLog(id);
        }));

        ipcMain.handle('export-pdf', logHandler('export-pdf', async (args: { actividades: any[]; filterLabel: string }) => {
            const { filePath, canceled } = await dialog.showSaveDialog(this.window!, {
                title: 'Exportar PDF',
                defaultPath: `informe-${Date.now()}.pdf`,
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });
            if (canceled || !filePath) return { canceled: true };
            const buffer = await generatePdf(args.actividades, args.filterLabel);
            const fs = require('fs');
            fs.writeFileSync(filePath, buffer);
            return { filePath };
        }));

        ipcMain.handle('export-word', logHandler('export-word', async (args: { actividades: any[]; filterLabel: string }) => {
            const { filePath, canceled } = await dialog.showSaveDialog(this.window!, {
                title: 'Exportar Word',
                defaultPath: `informe-${Date.now()}.docx`,
                filters: [{ name: 'Word', extensions: ['docx'] }]
            });
            if (canceled || !filePath) return { canceled: true };
            const buffer = await generateWord(args.actividades, args.filterLabel);
            const fs = require('fs');
            fs.writeFileSync(filePath, buffer);
            return { filePath };
        }));

        ipcMain.handle('generate-informe-tecnico', logHandler('generate-informe-tecnico', async (datos: Record<string, string>) => {
            const { filePath, canceled } = await dialog.showSaveDialog(this.window!, {
                title: 'Generar Informe Técnico',
                defaultPath: `IT-${datos.numeroInforme || Date.now()}_ADMINISTRACION.docx`,
                filters: [{ name: 'Word', extensions: ['docx'] }]
            });
            if (canceled || !filePath) return { canceled: true };
            const buffer = await generateInformeTecnico(datos);
            const fs = require('fs');
            fs.writeFileSync(filePath, buffer);
            return { filePath };
        }));

        ipcMain.handle('generate-informe-tecnico-pdf', logHandler('generate-informe-tecnico-pdf', async (datos: Record<string, string>) => {
            const { filePath, canceled } = await dialog.showSaveDialog(this.window!, {
                title: 'Generar Informe Técnico PDF',
                defaultPath: `IT-${datos.numeroInforme || Date.now()}_ADMINISTRACION.pdf`,
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });
            if (canceled || !filePath) return { canceled: true };
            const buffer = await generateInformeTecnicoPdf(datos);
            const fs = require('fs');
            fs.writeFileSync(filePath, buffer);
            return { filePath };
        }));

        ipcMain.handle('window-minimize', logHandler('window-minimize', () => {
            this.window?.minimize();
        }));

        ipcMain.handle('window-maximize', logHandler('window-maximize', () => {
            if (this.window?.isMaximized()) {
                this.window.unmaximize();
            } else {
                this.window?.maximize();
            }
        }));

        ipcMain.handle('window-close', logHandler('window-close', () => {
            this.window?.close();
        }));

        ipcMain.handle('window-is-maximized', logHandler('window-is-maximized', () => {
            return this.window?.isMaximized() ?? false;
        }));
    }
}

new Main();