import { esc } from '../escape';
import { formatFechaCorta } from '../date-format';
import type { ReportContext } from '../types';

export function InformeTecnicoPdf(
    data: Record<string, unknown>,
    _ctx: ReportContext,
    renderPreview: (data: Record<string, unknown>, ctx: ReportContext) => string
): string {
    const fechaCorta = formatFechaCorta(String(data.fecha || new Date().toISOString()));
    const ctx: ReportContext = {
        fecha: fechaCorta,
        numeroInforme: String(data.numeroInforme || ''),
    };
    const preview = renderPreview(data, ctx);
    // build dynamic specifications table from datos_tecnicos
    let datosObj: Record<string, unknown> = {};
    if (data.datos_tecnicos) {
        if (typeof data.datos_tecnicos === 'string') {
            try {
                datosObj = JSON.parse(data.datos_tecnicos);
            } catch (err) {
                console.warn('informe-pdf: datos_tecnicos JSON parse failed', err);
                datosObj = {};
            }
        } else if (typeof data.datos_tecnicos === 'object') {
            datosObj = data.datos_tecnicos as Record<string, unknown>;
        }
    }
    const entries = Object.entries(datosObj || {});
    let tablaEspecificaciones = '';
    if (entries.length > 0) {
        tablaEspecificaciones = `
    <section class="it-section">
        <div class="it-section-title">Especificaciones</div>
        <table class="it-equipment">
            <thead>
                <tr>
                    <th>Componente</th>
                    <th>Operativo</th>
                </tr>
            </thead>
            <tbody>
                ${entries.map(([key, value]) => {
                    let nombre = String(key);
                    let operativo = '';
                    if (value && typeof value === 'object') {
                        const obj: any = value as any;
                        if (obj.nombre) nombre = String(obj.nombre);
                        if (Object.prototype.hasOwnProperty.call(obj, 'operativo')) {
                            const op = obj.operativo;
                            if (typeof op === 'boolean') operativo = op ? 'Sí' : 'No';
                            else if (op != null) {
                                const s = String(op).toLowerCase();
                                operativo = (s === 'true' || s === 'si' || s === 'sí' || s === 'yes') ? 'Sí' : 'No';
                            }
                        }
                    }
                    return `
                <tr>
                    <td>${esc(nombre)}</td>
                    <td>${esc(operativo)}</td>
                </tr>
                `}).join('')}
            </tbody>
        </table>
    </section>
    `;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        color: #0f172a;
        font-size: 11px;
        line-height: 1.5;
        background: #fff;
    }
    .informe-doc {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 25mm 20mm;
        background: #fff;
        box-sizing: border-box;
        font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .informe-doc--informe-tecnico { color: #0f172a; }
    .it-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
    }
    .it-header-logo {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }
    .it-header-logo svg { display: block; }
    .it-header-logo-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1;
    }
    .it-header-logo-infante {
        font-family: Georgia, 'Times New Roman', serif;
        font-style: italic;
        font-size: 22px;
        font-weight: 700;
        color: #1b5e20;
        line-height: 1;
    }
    .it-header-logo-sub {
        font-size: 6.5px;
        color: #1b5e20;
        letter-spacing: 0.06em;
        margin-top: 1px;
        line-height: 1.15;
        text-transform: uppercase;
    }
    .it-header-logo-bottom {
        font-size: 6.5px;
        color: #1b5e20;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        font-weight: 600;
    }
    .it-header-text {
        flex: 1;
        text-align: center;
        font-size: 11px;
        line-height: 1.5;
        color: #0f172a;
    }
    .it-rule {
        border: 0;
        border-top: 1px solid #0f172a;
        margin: 12px 0 18px;
    }
    .it-date-row {
        text-align: right;
        font-size: 11px;
        margin-bottom: 22px;
    }
    .it-title {
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 6px;
        letter-spacing: 0.02em;
    }
    .it-number {
        text-align: right;
        font-weight: 700;
        font-size: 12px;
        margin-bottom: 22px;
    }
    .it-recipient {
        font-size: 11px;
        font-weight: 700;
        line-height: 1.55;
        margin-bottom: 22px;
    }
    .it-recipient-label { margin-bottom: 2px; }
    .it-greeting {
        text-align: center;
        font-size: 11px;
        line-height: 1.55;
        margin: 0 auto 18px;
        max-width: 92%;
    }
    .it-equipment {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
        margin-bottom: 18px;
    }
    .it-equipment thead th {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 6px 10px;
        text-align: center;
        font-size: 10px;
        font-weight: 700;
        color: #0f172a;
    }
    .it-equipment tbody td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        vertical-align: top;
        color: #0f172a;
    }
    .it-equipment .it-bold { font-weight: 700; }
    .it-components {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
        margin: 14px 0;
        page-break-inside: auto;
    }
    .it-components td {
        border: 1px solid #cbd5e1;
        padding: 10px 12px;
        text-align: center;
        vertical-align: middle;
        width: 25%;
    }
    .it-components td:empty { border-color: transparent; }
    .it-comp-name { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; margin: -10px -12px 4px -12px; padding: 6px 12px; font-size: 9px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }
    .it-comp-estado { font-size: 11px; font-weight: 600; color: #334155; }
    .it-components tbody tr { page-break-inside: avoid; }
    .it-components .it-diagnostico { font-weight: 700; text-align: left; font-size: 10px; padding: 8px 12px; }
    .it-greeting--compact { font-size: 11px; margin: 4px 0 6px; font-weight: 600; color: #334155; }
    .it-closing {
        font-weight: 700;
        font-size: 11px;
        margin: 14px 0 22px;
    }
    .it-firmas {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
    }
    .it-firmas thead th {
        border: 1px solid #cbd5e1;
        padding: 6px 10px;
        font-weight: 700;
        text-align: center;
        color: #0f172a;
        font-size: 10px;
    }
    .it-firmas tbody td {
        border: 1px solid #cbd5e1;
        height: 90px;
        vertical-align: bottom;
        padding: 10px 10px 16px;
        text-align: center;
        font-weight: 700;
        font-size: 10.5px;
    }
    .it-firma-line { display: inline-block; }
</style>
</head>
<body>
${preview}
${tablaEspecificaciones}
</body>
</html>`;
}
