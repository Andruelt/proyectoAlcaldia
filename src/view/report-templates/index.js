import { informeTecnicoTemplate } from './informe-tecnico.js';
import { reporteActividadTemplate } from './reporte-actividad.js';

export const templates = {
    list: [informeTecnicoTemplate, reporteActividadTemplate],
    get(id) {
        return this.list.find(t => t.id === id);
    },
    defaultValues(templateId, actividad, ctx) {
        const t = this.get(templateId);
        if (!t) return {};
        return t.defaultValues(actividad, ctx);
    },
    renderPreview(templateId, data, ctx) {
        const t = this.get(templateId);
        if (!t) return '';
        return t.renderPreview(data, ctx);
    },
};
