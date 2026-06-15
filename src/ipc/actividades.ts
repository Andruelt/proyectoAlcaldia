import type { IpcMain } from 'electron';
import type { ActividadesAdapter } from '../database/actividades-adapter';
import { withLogging } from './index';

export function registerActividadHandlers(ipc: IpcMain, actividades: ActividadesAdapter): void {
    ipc.handle('get-actividades', withLogging('get-actividades', () => actividades.getAll()));
    ipc.handle('add-actividad', withLogging('add-actividad', (data: { direccionId: string; incidenciaId: string; descripcion: string; estado?: string; prioridad?: string; tipoEquipo?: string; datosTecnicos?: any }) => {
        return actividades.add(data.direccionId, data.incidenciaId, data.descripcion, data.estado, data.prioridad, data.tipoEquipo, data.datosTecnicos);
    }));
    ipc.handle('update-actividad', withLogging('update-actividad', (data: { id: string; direccionId: string; incidenciaId: string; descripcion: string; tipoEquipo?: string; datosTecnicos?: any }) => {
        actividades.update(data.id, data.direccionId, data.incidenciaId, data.descripcion, data.tipoEquipo, data.datosTecnicos);
    }));
    ipc.handle('delete-actividad', withLogging('delete-actividad', (id: string) => {
        actividades.delete(id);
    }));
    ipc.handle('update-actividad-estado', withLogging('update-actividad-estado', (data: { id: string; estado: string }) => {
        actividades.updateEstado(data.id, data.estado);
    }));
    ipc.handle('update-actividad-prioridad', withLogging('update-actividad-prioridad', (data: { id: string; prioridad: string }) => {
        actividades.updatePrioridad(data.id, data.prioridad);
    }));
    ipc.handle('get-actividad-con-log', withLogging('get-actividad-con-log', (id: string) => {
        return actividades.getActividadConLog(id);
    }));
    ipc.handle('get-actividades-por-direccion', withLogging('get-actividades-por-direccion', (direccionId?: string) => {
        return actividades.getPorDireccion(direccionId);
    }));
    ipc.handle('get-actividades-rango', withLogging('get-actividades-rango', (args: { inicio: string; fin: string }) => {
        return actividades.getPorRango(args.inicio, args.fin);
    }));
}
