import type { IpcMain } from 'electron';
import type { ActividadesAdapter } from '../database/actividades-adapter';
import type { MetricsAdapter } from '../database/metrics-adapter';
import { withLogging } from './index';

export function registerMetricsHandlers(
    ipc: IpcMain,
    metrics: MetricsAdapter,
    actividades: ActividadesAdapter
): void {
    ipc.handle('get-stats', withLogging('get-stats', () => {
        metrics.recomputeMetrics();
        return metrics.getStats();
    }));
    ipc.handle('get-metrics-history', withLogging('get-metrics-history', () => {
        return metrics.getHistory();
    }));
    ipc.handle('get-analytics', withLogging('get-analytics', (inicio: string) => {
        return actividades.getAnalyticsPorPeriodo(inicio);
    }));
    ipc.handle('get-analytics-rango', withLogging('get-analytics-rango', (args: { inicio: string; fin: string }) => {
        return actividades.getAnalyticsPorRango(args.inicio, args.fin);
    }));
    ipc.handle('get-actividades-por-estado', withLogging('get-actividades-por-estado', () => {
        return actividades.getActividadesPorEstado();
    }));
    ipc.handle('get-actividades-por-prioridad', withLogging('get-actividades-por-prioridad', () => {
        return actividades.getActividadesPorPrioridad();
    }));
    ipc.handle('get-actividades-por-direccion-stats', withLogging('get-actividades-por-direccion-stats', (args: { inicio: string; fin: string }) => {
        return actividades.getActividadesPorDireccionStats(args.inicio, args.fin);
    }));
    ipc.handle('get-tendencia', withLogging('get-tendencia', (semanas: number) => {
        return actividades.getTendencia(semanas);
    }));
}
