export type FieldType = 'text' | 'longtext' | 'date' | 'number' | 'select';

export interface FieldOption {
    value: string;
    label: string;
}

export interface ReportField {
    key: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    maxLength?: number;
    options?: FieldOption[];
    defaultValue?: string | ((actividad: ActividadRef, ctx: ReportContext) => string);
    group?: string;
    hint?: string;
}

export interface ActividadRef {
    id: string;
    direccion?: string;
    incidencia?: string;
    descripcion?: string;
    estado?: string;
    prioridad?: string;
    created_at?: string;
    resolved_at?: string | null;
    direccion_id?: string;
    incidencia_id?: string;
    tipo_equipo?: string;
    datos_tecnicos?: Record<string, unknown>;
}

export interface ReportContext {
    fecha: string;
    numeroInforme: string;
    filterLabel?: string;
    actividad?: ActividadRef;
}

export type FieldValueResolver = (actividad: ActividadRef, ctx: ReportContext) => string;

export interface ComponenteItem {
    nombre: string;
    estado: string;
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    fields: ReportField[];
    defaultValues(actividad: ActividadRef | undefined, ctx: ReportContext): Record<string, unknown>;
    renderPreview(data: Record<string, unknown>, ctx: ReportContext): string;
    renderPdfHtml(data: Record<string, unknown>, ctx: ReportContext): string;
    buildDocx(data: Record<string, unknown>, ctx: ReportContext): unknown[];
}
