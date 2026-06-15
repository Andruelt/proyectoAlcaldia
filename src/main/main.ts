import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { DatabaseAdapter } from '../database/database';
import { createDireccionesAdapter } from '../database/direcciones-adapter';
import { createIncidenciasAdapter } from '../database/incidencias-adapter';
import { ActividadesAdapter } from '../database/actividades-adapter';
import { MetricsAdapter } from '../database/metrics-adapter';
import { registerIpcHandlers } from '../ipc';

class Main {
    private window: BrowserWindow | null = null;
    private direcciones = createDireccionesAdapter(DatabaseAdapter.getInstance());
    private incidencias = createIncidenciasAdapter(DatabaseAdapter.getInstance());
    private actividades!: ActividadesAdapter;
    private metrics!: MetricsAdapter;

    constructor() {
        app.whenReady().then(() => this.initApp());
        app.on('window-all-closed', () => this.onWindowAllClosed());
        app.on('activate', () => this.onActivate());
        app.on('before-quit', () => DatabaseAdapter.getInstance().close());
    }

    private async initApp(): Promise<void> {
        await this.initDatabase();
        this.createWindow();
        this.setupIpc();
    }

    private async initDatabase(): Promise<void> {
        const db = DatabaseAdapter.getInstance();
        await db.connect('alcaldia.db');
        db.initTables();
        db.seedIfEmpty();
        this.direcciones = createDireccionesAdapter(db);
        this.incidencias = createIncidenciasAdapter(db);
        this.actividades = new ActividadesAdapter(db);
        this.metrics = new MetricsAdapter(db);
    }

    private createWindow(): void {
        this.window = new BrowserWindow({
            width: 1280,
            height: 820,
            minWidth: 1024,
            minHeight: 640,
            frame: false,
            titleBarStyle: 'hidden',
            transparent: true,
            backgroundColor: '#00000000',
            webPreferences: {
                preload: path.join(__dirname, '../preload/preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });

        this.window.loadURL(url.pathToFileURL(path.join(__dirname, '../view/index.html')).href);
        this.window.on('closed', () => { this.window = null; });
    }

    private onWindowAllClosed(): void {
        if (process.platform !== 'darwin') app.quit();
    }

    private onActivate(): void {
        if (this.window === null) this.createWindow();
    }

    private setupIpc(): void {
        registerIpcHandlers({
            window: this.window,
            direcciones: this.direcciones,
            incidencias: this.incidencias,
            actividades: this.actividades,
            metrics: this.metrics,
            ipcMain,
        });
    }
}

new Main();
