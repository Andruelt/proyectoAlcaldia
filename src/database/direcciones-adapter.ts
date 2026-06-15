import { DatabaseAdapter } from './database';
import { NamedEntityAdapter } from './adapters/named-entity';

export const DireccionesAdapter = NamedEntityAdapter;
export const IncidenciasAdapter = NamedEntityAdapter;

export type Direccion = { id: string; nombre: string };
export type Incidencia = { id: string; nombre: string };

export function createDireccionesAdapter(db: DatabaseAdapter): NamedEntityAdapter {
    return new NamedEntityAdapter(db, 'direcciones');
}

export function createIncidenciasAdapter(db: DatabaseAdapter): NamedEntityAdapter {
    return new NamedEntityAdapter(db, 'incidencias');
}
