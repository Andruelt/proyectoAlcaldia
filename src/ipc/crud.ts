import type { IpcMain } from 'electron';
import type { NamedEntityAdapter } from '../database/adapters/named-entity';
import { withLogging } from './index';

export function registerCrudHandlers(
    ipc: IpcMain,
    direcciones: NamedEntityAdapter,
    incidencias: NamedEntityAdapter
): void {
    ipc.handle('get-direcciones', withLogging('get-direcciones', () => direcciones.getAll()));
    ipc.handle('add-direccion', withLogging('add-direccion', (nombre: string) => {
        if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
        return direcciones.add(nombre);
    }));
    ipc.handle('update-direccion', withLogging('update-direccion', (data: { id: string; nombre: string }) => {
        direcciones.update(data.id, data.nombre);
    }));
    ipc.handle('delete-direccion', withLogging('delete-direccion', (id: string) => {
        direcciones.delete(id);
    }));

    ipc.handle('get-incidencias', withLogging('get-incidencias', () => incidencias.getAll()));
    ipc.handle('add-incidencia', withLogging('add-incidencia', (nombre: string) => {
        if (!nombre || !nombre.trim()) throw new Error('Nombre vacío');
        return incidencias.add(nombre);
    }));
    ipc.handle('update-incidencia', withLogging('update-incidencia', (data: { id: string; nombre: string }) => {
        incidencias.update(data.id, data.nombre);
    }));
    ipc.handle('delete-incidencia', withLogging('delete-incidencia', (id: string) => {
        incidencias.delete(id);
    }));
}
