import type { BrowserWindow, IpcMain } from 'electron';
import type { NamedEntityAdapter } from '../database/adapters/named-entity';
import type { ActividadesAdapter } from '../database/actividades-adapter';
import type { MetricsAdapter } from '../database/metrics-adapter';
import { registerCrudHandlers } from './crud';
import { registerActividadHandlers } from './actividades';
import { registerMetricsHandlers } from './metrics';
import { registerReportHandlers } from './reports';
import { registerTemplateHandlers } from './templates';
import { registerWindowHandlers } from './window';

export interface HandlerContext {
    window: BrowserWindow | null;
    direcciones: NamedEntityAdapter;
    incidencias: NamedEntityAdapter;
    actividades: ActividadesAdapter;
    metrics: MetricsAdapter;
    ipcMain: IpcMain;
}

export function registerIpcHandlers(ctx: HandlerContext): void {
    registerCrudHandlers(ctx.ipcMain, ctx.direcciones, ctx.incidencias);
    registerActividadHandlers(ctx.ipcMain, ctx.actividades);
    registerMetricsHandlers(ctx.ipcMain, ctx.metrics, ctx.actividades);
    registerTemplateHandlers(ctx.ipcMain);
    registerReportHandlers(ctx.ipcMain, ctx.window);
    registerWindowHandlers(ctx.ipcMain, ctx.window);
}

export function withLogging(channel: string, fn: (...args: any[]) => any) {
    return async (_event: any, ...args: any[]) => {
        const start = Date.now();
        try {
            const result = await fn(...args);
            return result;
        } catch (e: any) {
            console.error(`[IPC:ERR] ${channel} (${Date.now() - start}ms)`, e.message);
            console.error(e.stack);
            throw e;
        }
    };
}
