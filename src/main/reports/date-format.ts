const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function parseLocal(iso: string): Date | null {
    if (!iso) return null;
    const trimmed = String(iso).trim();
    if (!trimmed) return null;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    if (dateOnly) {
        const [y, m, d] = trimmed.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
}

export function formatFechaLarga(iso: string): string {
    const d = parseLocal(iso);
    if (!d) return iso || '';
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatFechaCorta(iso: string): string {
    const d = parseLocal(iso);
    if (!d) return iso || '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
}

export function formatFechaHumana(iso: string): string {
    const d = parseLocal(iso);
    if (!d) return iso || '';
    return d.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function todayIso(): string {
    return new Date().toISOString();
}

export function todayShort(): string {
    return formatFechaCorta(new Date().toISOString());
}

export function todayLong(): string {
    return formatFechaLarga(new Date().toISOString());
}
