import { esc } from '../escape';
import { formatFechaCorta, formatFechaLarga, todayIso } from '../date-format';
import type { ReportContext, ReportField, ReportTemplate } from '../types';
import {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    BorderStyle,
} from 'docx';

const REPORTE_ACTIVIDAD_FIELDS: ReportField[] = [
    { key: 'fecha', label: 'Fecha del reporte', type: 'date', required: true, group: 'Encabezado' },
    { key: 'periodo', label: 'Período (opcional)', type: 'text', placeholder: 'Semana 24, Mes, etc.', group: 'Encabezado' },
    { key: 'resumenEjecutivo', label: 'Resumen ejecutivo', type: 'longtext', rows: 4, placeholder: 'Resumen de la actividad realizada…', group: 'Contenido' },
    { key: 'observaciones', label: 'Observaciones', type: 'longtext', rows: 3, placeholder: 'Observaciones adicionales…', group: 'Contenido' },
    { key: 'recomendaciones', label: 'Recomendaciones', type: 'longtext', rows: 3, placeholder: 'Acciones recomendadas…', group: 'Contenido' },
    { key: 'tecnico', label: 'Técnico responsable', type: 'text', placeholder: 'Nombre del técnico', group: 'Cierre' },
    { key: 'cargoTecnico', label: 'Cargo del técnico', type: 'text', placeholder: 'Analista de Soporte', group: 'Cierre' },
];

const val = (data: Record<string, string>, key: string, fallback = ''): string => {
    const v = data[key];
    return v === undefined || v === null ? fallback : v;
};

const PRIORIDAD_LABEL: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica',
};

const ESTADO_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completado: 'Completado',
    cancelado: 'Cancelado',
};

const renderPreview = (data: Record<string, string>, ctx: ReportContext): string => {
    const fecha = data.fecha || ctx.fecha || todayIso();
    const actividad = ctx.actividad;
    return `
<article class="informe-doc informe-doc--reporte-actividad">
    <header class="ra-header">
        <div class="ra-header-titles">
            <div class="ra-eyebrow">Reporte de Actividad</div>
            <h1 class="ra-title">${esc(val(data, 'periodo', 'Reporte individual'))}</h1>
            <div class="ra-meta">Fecha: <strong>${esc(formatFechaCorta(fecha))}</strong></div>
        </div>
    </header>
    ${actividad ? `
    <section class="ra-section">
        <div class="ra-section-title">Información general</div>
        <div class="ra-info-grid">
            <div><span class="ra-label">Dirección</span><span class="ra-value">${esc(actividad.direccion || '—')}</span></div>
            <div><span class="ra-label">Incidencia</span><span class="ra-value">${esc(actividad.incidencia || '—')}</span></div>
            <div><span class="ra-label">Estado</span><span class="ra-value">${esc(ESTADO_LABEL[actividad.estado || ''] || '—')}</span></div>
            <div><span class="ra-label">Prioridad</span><span class="ra-value">${esc(PRIORIDAD_LABEL[actividad.prioridad || ''] || '—')}</span></div>
            <div><span class="ra-label">Creada</span><span class="ra-value">${esc(formatFechaLarga(actividad.created_at || ''))}</span></div>
            <div><span class="ra-label">Resuelta</span><span class="ra-value">${actividad.resolved_at ? esc(formatFechaLarga(actividad.resolved_at)) : '—'}</span></div>
        </div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Descripción</div>
        <div class="ra-prose">${esc(actividad.descripcion || 'Sin descripción')}</div>
    </section>
    ` : ''}
    <section class="ra-section">
        <div class="ra-section-title">Resumen ejecutivo</div>
        <div class="ra-prose">${esc(val(data, 'resumenEjecutivo', actividad?.descripcion || '')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Observaciones</div>
        <div class="ra-prose">${esc(val(data, 'observaciones', 'Sin observaciones registradas.')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-section">
        <div class="ra-section-title">Recomendaciones</div>
        <div class="ra-prose">${esc(val(data, 'recomendaciones', 'Sin recomendaciones registradas.')).replace(/\n/g, '<br/>')}</div>
    </section>
    <section class="ra-signature">
        <div class="ra-sig-label">Atentamente,</div>
        <div class="ra-sig-name"><strong>${esc(val(data, 'tecnico', ''))}</strong></div>
        <div class="ra-sig-role">${esc(val(data, 'cargoTecnico', ''))}</div>
    </section>
</article>`;
};

const renderPdf = (data: Record<string, string>, ctx: ReportContext): string => {
    const preview = renderPreview(data, ctx);
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; background: #fff; }
    .informe-doc { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 25mm 22mm; background: #fff; box-sizing: border-box; }
    .ra-header { border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 22px; }
    .ra-eyebrow { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .ra-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .ra-meta { font-size: 11px; color: #475569; }
    .ra-section { margin-bottom: 20px; }
    .ra-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #1e293b; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .ra-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .ra-info-grid > div { display: flex; flex-direction: column; gap: 2px; }
    .ra-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em; }
    .ra-value { font-size: 12px; color: #0f172a; font-weight: 500; }
    .ra-prose { font-size: 12px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .ra-signature { margin-top: 36px; padding-top: 16px; }
    .ra-sig-label { font-size: 11px; color: #475569; margin-bottom: 24px; }
    .ra-sig-name { font-size: 13px; }
    .ra-sig-role { font-size: 11px; color: #475569; margin-top: 2px; }
</style>
</head>
<body>${preview}</body>
</html>`;
};

const buildDocx = (data: Record<string, string>, ctx: ReportContext): unknown[] => {
    const actividad = ctx.actividad;
    const fecha = data.fecha || ctx.fecha || todayIso();
    const fechaCorta = formatFechaCorta(fecha);
    const infoRow = (label: string, value: string): TableRow => new TableRow({
        children: [
            new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: '64748B' })] })],
                borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
            }),
            new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 22 })] })],
                borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
            }),
        ],
    });

    const infoTable = actividad ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            infoRow('Dirección', actividad.direccion || ''),
            infoRow('Incidencia', actividad.incidencia || ''),
            infoRow('Estado', ESTADO_LABEL[actividad.estado || ''] || '—'),
            infoRow('Prioridad', PRIORIDAD_LABEL[actividad.prioridad || ''] || '—'),
            infoRow('Creada', formatFechaLarga(actividad.created_at || '')),
            infoRow('Resuelta', actividad.resolved_at ? formatFechaLarga(actividad.resolved_at) : '—'),
        ],
    }) : new Paragraph({ text: '' });

    return [
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: 'Reporte de Actividad', size: 20, color: '64748B', bold: true })],
        }),
        new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: val(data, 'periodo', 'Reporte individual'), bold: true, size: 40 })],
        }),
        new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: 'Fecha: ', size: 22 }), new TextRun({ text: fechaCorta, size: 22, bold: true })],
        }),
        infoTable,
        new Paragraph({ text: '', spacing: { before: 240, after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: 'Descripción', bold: true, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: actividad?.descripcion || 'Sin descripción', size: 22 })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'Resumen ejecutivo', bold: true, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: val(data, 'resumenEjecutivo', actividad?.descripcion || ''), size: 22 })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'Observaciones', bold: true, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: val(data, 'observaciones', 'Sin observaciones registradas.'), size: 22 })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'Recomendaciones', bold: true, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: val(data, 'recomendaciones', 'Sin recomendaciones registradas.'), size: 22 })], spacing: { after: 360 } }),
        new Paragraph({ children: [new TextRun({ text: 'Atentamente,', size: 22 })], spacing: { after: 360 } }),
        new Paragraph({ children: [new TextRun({ text: val(data, 'tecnico', ''), bold: true, size: 24 })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: val(data, 'cargoTecnico', ''), size: 22, color: '64748B' })] }),
    ];
};

export const ReporteActividadTemplate: ReportTemplate = {
    id: 'reporte-actividad',
    name: 'Reporte de Actividad',
    description: 'Resumen ejecutivo de la actividad con observaciones y recomendaciones. Ideal como reporte individual.',
    icon: 'activity',
    fields: REPORTE_ACTIVIDAD_FIELDS,
    defaultValues(actividad, ctx) {
        return {
            fecha: ctx.fecha,
            periodo: actividad ? formatFechaLarga(actividad.created_at || '') : '',
            resumenEjecutivo: actividad?.descripcion || '',
            observaciones: '',
            recomendaciones: '',
            tecnico: '',
            cargoTecnico: '',
        };
    },
    renderPreview,
    renderPdfHtml: renderPdf,
    buildDocx,
};
