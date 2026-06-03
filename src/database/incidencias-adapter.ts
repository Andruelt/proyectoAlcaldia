import { DatabaseAdapter } from './database';

export interface Incidencia {
    id: string;
    nombre: string;
}

export class IncidenciasAdapter {
    constructor(private db: DatabaseAdapter) {}

    public getAll(): Incidencia[] {
        return this.db.all<Incidencia>(
            'SELECT id, nombre FROM incidencias WHERE deleted_at IS NULL ORDER BY created_at DESC'
        );
    }

    public add(nombre: string): string {
        const trimmed = nombre.trim();
        if (!trimmed) throw new Error('El nombre de la incidencia no puede estar vacío');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.db.run('INSERT INTO incidencias (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, trimmed, now, now]);
        this.db.save();
        return id;
    }

    public update(id: string, nombre: string): void {
        const now = new Date().toISOString();
        this.db.run('UPDATE incidencias SET nombre = ?, updated_at = ? WHERE id = ?', [nombre, now, id]);
        this.db.save();
    }

    public delete(id: string): void {
        const now = new Date().toISOString();
        this.db.run('UPDATE incidencias SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.db.save();
    }
}
