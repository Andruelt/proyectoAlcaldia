import type { DatabaseAdapter } from '../database';

export interface NamedEntity {
    id: string;
    nombre: string;
}

export class NamedEntityAdapter {
    constructor(
        private db: DatabaseAdapter,
        private table: 'direcciones' | 'incidencias'
    ) {}

    public getAll(): NamedEntity[] {
        return this.db.all<NamedEntity>(
            `SELECT id, nombre FROM ${this.table} WHERE deleted_at IS NULL ORDER BY created_at DESC`
        );
    }

    public add(nombre: string): string {
        const trimmed = nombre.trim();
        if (!trimmed) throw new Error(`El nombre no puede estar vacío`);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        this.db.run(
            `INSERT INTO ${this.table} (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)`,
            [id, trimmed, now, now]
        );
        this.db.save();
        return id;
    }

    public update(id: string, nombre: string): void {
        const now = new Date().toISOString();
        this.db.run(
            `UPDATE ${this.table} SET nombre = ?, updated_at = ? WHERE id = ?`,
            [nombre, now, id]
        );
        this.db.save();
    }

    public delete(id: string): void {
        const now = new Date().toISOString();
        this.db.run(
            `UPDATE ${this.table} SET deleted_at = ?, updated_at = ? WHERE id = ?`,
            [now, now, id]
        );
        this.db.save();
    }
}
