import { DatabaseAdapter } from './database';

export interface Direccion {
    id: string;
    nombre: string;
}

export class DireccionesAdapter {
    constructor(private db: DatabaseAdapter) {}

    public getAll(): Direccion[] {
        return this.db.all<Direccion>(
            'SELECT id, nombre FROM direcciones WHERE deleted_at IS NULL ORDER BY created_at DESC'
        );
    }

    public add(nombre: string): string {
        const trimmed = nombre.trim();
        if (!trimmed) throw new Error('El nombre de la dirección no puede estar vacío');
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.db.run('INSERT INTO direcciones (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, trimmed, now, now]);
        this.db.save();
        return id;
    }

    public update(id: string, nombre: string): void {
        const now = new Date().toISOString();
        this.db.run('UPDATE direcciones SET nombre = ?, updated_at = ? WHERE id = ?', [nombre, now, id]);
        this.db.save();
    }

    public delete(id: string): void {
        const now = new Date().toISOString();
        this.db.run('UPDATE direcciones SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
        this.db.save();
    }
}
