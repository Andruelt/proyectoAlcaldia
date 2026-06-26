import type { ReportTemplate } from './types';
import { InformeTecnicoTemplate } from './templates/informe-tecnico';

const ALL_TEMPLATES: ReportTemplate[] = [
    InformeTecnicoTemplate,
];

export function listTemplates(): ReportTemplate[] {
    return ALL_TEMPLATES;
}

export function getTemplate(id: string): ReportTemplate | undefined {
    return ALL_TEMPLATES.find(t => t.id === id);
}

export type { ReportTemplate, ReportField, ReportContext, ActividadRef, FieldType } from './types';
