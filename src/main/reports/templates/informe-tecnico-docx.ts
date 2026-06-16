import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    AlignmentType,
    BorderStyle,
    VerticalAlign,
} from 'docx';
import { formatFechaCorta, formatFechaLarga, todayIso } from '../date-format';
import type { ReportContext } from '../types';

const val = (data: Record<string, unknown>, key: string, fallback = ''): string => {
    const v = data[key];
    return v === undefined || v === null ? fallback : String(v);
};

const BORDER = (color = 'CBD5E1') => ({
    style: BorderStyle.SINGLE,
    size: 4,
    color,
});

const NO_BORDER = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
};

const cell = (children: Paragraph[], opts: { width?: number; bold?: boolean; bg?: string; vmerge?: 'restart' | 'continue'; noBorder?: boolean } = {}): TableCell => {
    const CELL_MARGINS = { top: 120, bottom: 120, left: 150, right: 150 };
    if (opts.noBorder) {
        return new TableCell({
            children,
            width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
            margins: CELL_MARGINS,
        });
    }
    const borders = {
        top: BORDER(),
        bottom: BORDER(),
        left: BORDER(),
        right: BORDER(),
    };
    return new TableCell({
        children,
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts.bg ? { fill: opts.bg, type: 'clear' } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        borders,
        margins: CELL_MARGINS,
    });
};

const p = (text: string, opts: { bold?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number; line?: number } } = {}): Paragraph => {
    return new Paragraph({
        children: [new TextRun({ text, bold: opts.bold, size: opts.size || 17 })],
        alignment: opts.align,
        spacing: { before: opts.spacing?.before || 0, after: opts.spacing?.after || 0, line: opts.spacing?.line || 280 },
    });
};

const toString = (v: unknown): string => {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try { return JSON.stringify(v); } catch { return String(v); }
};

const buildSpecsTable = (raw: unknown, diagnostico: string): Table | null => {
    let datos: Record<string, unknown> = {};
    if (!raw) return null;
    if (typeof raw === 'string') {
        try { datos = JSON.parse(raw); } catch { datos = {}; }
    } else if (typeof raw === 'object') {
        datos = raw as Record<string, unknown>;
    }
    const keys = Object.keys(datos || {});
    if (keys.length === 0 && !diagnostico) return null;

    const rows: TableRow[] = [];
    // Header: Componente | Operativo
    rows.push(new TableRow({
        tableHeader: true,
        children: [
            cell([p('Componente', { bold: true })], { width: 70, bg: 'F1F5F9' }),
            cell([p('Operativo', { bold: true })], { width: 30, bg: 'F1F5F9' }),
        ],
    }));

    for (const k of keys) {
        const rawVal = datos[k];
        let nombre = k;
        let operativo = '';
        if (rawVal && typeof rawVal === 'object') {
            const obj: any = rawVal as any;
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
        rows.push(new TableRow({
            children: [
                cell([p(String(nombre), { size: 17 })]),
                cell([p(String(operativo), { size: 17 })]),
            ],
        }));
    }

    if (diagnostico) {
        rows.push(new TableRow({
            children: [
                cell([p('Diagnóstico', { bold: true })], { width: 70, bg: 'F1F5F9' }),
                cell([p(diagnostico)], { width: 30 }),
            ],
        }));
    }

    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
};

const buildDynamicComponentesTable = (componentes: unknown, diagnostico: string): Table | null => {
    let items: Array<{ nombre: string; estado: string }> = [];
    if (!componentes) return null;
    if (Array.isArray(componentes)) {
        items = componentes as Array<{ nombre: string; estado: string }>;
    }
    if (items.length === 0 && !diagnostico) return null;

    const rows: TableRow[] = [];
    const CHUNK = 4;

    for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const cells: TableCell[] = chunk.map(item =>
            cell([
                p(item.nombre || '', { bold: true, size: 16, align: AlignmentType.CENTER }),
                p(item.estado || '', { size: 17, align: AlignmentType.CENTER }),
            ], { width: 25 })
        );
        // Fill remaining cells
        while (cells.length < CHUNK) {
            cells.push(cell([p('')], { width: 25 }));
        }
        rows.push(new TableRow({ children: cells }));
    }

    if (diagnostico) {
        const SPAN = CHUNK;
        rows.push(new TableRow({
            children: [
                new TableCell({
                    columnSpan: SPAN,
                    children: [
                        p('Diagnóstico: ' + diagnostico, { bold: true, size: 16 }),
                    ],
                    shading: { fill: 'F1F5F9', type: 'clear' },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: { top: BORDER(), bottom: BORDER(), left: BORDER(), right: BORDER() },
                    margins: { top: 120, bottom: 120, left: 150, right: 150 },
                }),
            ],
        }));
    }

    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
};

const logoParagraph = (): Paragraph[] => {
    const size = 17;
    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 20 },
            children: [
                new TextRun({ text: 'Infante', bold: true, italics: true, size: 26, color: '1B5E20', font: 'Georgia' }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 20 },
            children: [new TextRun({ text: 'Alcaldía Municipio Autónomo', size, color: '1B5E20' })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 20 },
            children: [new TextRun({ text: 'Leonardo Infante', size, color: '1B5E20', bold: true })],
        }),
    ];
};

export function InformeTecnicoDocx(data: Record<string, unknown>, _ctx: ReportContext): unknown[] {
    const fechaCorta = formatFechaCorta(String(data.fecha || todayIso()));
    const fechaISO = String(data.fecha || todayIso());

    const diagnostico = String(data.diagnostico || '').trim();

    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: NO_BORDER,
            bottom: NO_BORDER,
            left: NO_BORDER,
            right: NO_BORDER,
            insideHorizontal: NO_BORDER,
            insideVertical: NO_BORDER,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 28, type: WidthType.PERCENTAGE },
                        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                        children: logoParagraph(),
                    }),
                    new TableCell({
                        width: { size: 72, type: WidthType.PERCENTAGE },
                        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                        children: [
                            p('República Bolivariana de Venezuela', { bold: true, align: AlignmentType.CENTER, spacing: { after: 20 } }),
                            p('Alcaldía del Municipio Autónomo Leonardo Infante', { bold: true, align: AlignmentType.CENTER, spacing: { after: 20 } }),
                            p('Valle de la Pascua, Edo. Guárico', { bold: true, align: AlignmentType.CENTER, spacing: { after: 20 } }),
                            p('Dirección de Informática y Sistemas', { bold: true, align: AlignmentType.CENTER, spacing: { after: 20 } }),
                        ],
                    }),
                ],
            }),
        ],
    });

    const dateRow = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                spacing: { before: 0, after: 0, line: 280 },
                                children: [new TextRun({ text: 'Valle de la Pascua: ', size: 17 }), new TextRun({ text: fechaCorta, size: 17, bold: true })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    const equipmentTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Código del Bien', bold: true, size: 17 })] })], { width: 25, bg: 'F1F5F9' }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Descripción', bold: true, size: 17 })] })], { width: 38, bg: 'F1F5F9' }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Requerimiento', bold: true, size: 17 })] })], { width: 37, bg: 'F1F5F9' }),
                ],
            }),
            new TableRow({
                children: [
                    cell([new Paragraph({ children: [new TextRun({ text: val(data, 'codigoBien'), size: 17 })] })], { width: 25 }),
                    cell([new Paragraph({ children: [new TextRun({ text: val(data, 'descripcion'), size: 17 })] })], { width: 38 }),
                    cell([new Paragraph({ children: [new TextRun({ text: val(data, 'requerimiento'), size: 17 })] })], { width: 37 }),
                ],
            }),
        ],
    });

    const specsTable = buildSpecsTable((data as any).datos_tecnicos, diagnostico);
    const componentesTable = buildDynamicComponentesTable((data as any).componentes, !specsTable ? diagnostico : '');

    const simpleDiagTable = !componentesTable && !specsTable && diagnostico ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    cell([new Paragraph({ children: [new TextRun({ text: 'Diagnóstico', bold: true, size: 17 })] })], { width: 25 }),
                    cell([new Paragraph({ children: [new TextRun({ text: diagnostico, size: 17 })] })], { width: 75 }),
                ],
            }),
        ],
    }) : null;

    const firmasTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: [
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val(data, 'firma1', 'INFORMATICA Y SISTEMA'), bold: true, size: 17 })] })], { width: 33, bg: 'F1F5F9' }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val(data, 'firma2', 'DIVISION DE REGISTRO Y CONTROL DE BIENES'), bold: true, size: 17 })] })], { width: 34, bg: 'F1F5F9' }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val(data, 'firma3', 'RECIBIDO POR:'), bold: true, size: 17 })] })], { width: 33, bg: 'F1F5F9' }),
                ],
            }),
            new TableRow({
                children: [
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FIRMA: _______________', size: 17 })] })], { width: 33 }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FIRMA: _______________', size: 17 })] })], { width: 34 }),
                    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FIRMA: _______________', size: 17 })] })], { width: 33 }),
                ],
            }),
        ],
    });

    return [
        headerTable,
        new Paragraph({ text: '', spacing: { before: 0, after: 0 } }),
        dateRow,
        new Paragraph({ text: '', spacing: { before: 0, after: 0 } }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 360, after: 60 },
            children: [new TextRun({ text: 'INFORME TÉCNICO', bold: true, size: 32 })],
        }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: `N° ${val(data, 'numeroInforme', '—')}`, bold: true, size: 20 })],
        }),
        new Paragraph({
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: 'CIUDADANO:', bold: true, size: 17 })],
        }),
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: val(data, 'destinatarioNombre'), bold: true, size: 17 })] }),
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: val(data, 'destinatarioCargo'), bold: true, size: 17 })] }),
        new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: val(data, 'destinatarioDpto'), bold: true, size: 17 })] }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240, line: 320 },
            children: [new TextRun({ text: 'Luego de extenderle un cordial saludo me dirijo a usted con la finalidad de dar a conocer el diagnóstico obtenido de la revisión de los siguientes equipos:', size: 17 })],
        }),
        equipmentTable,
        ...(componentesTable ? [new Paragraph({ text: '', spacing: { before: 0, after: 0 } }), componentesTable] : []),
        ...(specsTable ? [new Paragraph({ text: '', spacing: { before: 0, after: 0 } }), specsTable] : []),
        ...(simpleDiagTable ? [new Paragraph({ text: '', spacing: { before: 0, after: 0 } }), simpleDiagTable] : []),
        new Paragraph({ text: '', spacing: { before: 0, after: 0 } }),
        new Paragraph({
            spacing: { before: 240, after: 240 },
            children: [new TextRun({ text: 'Sin más a que hacer referencia.', bold: true, size: 17 })],
        }),
        new Paragraph({ text: '', spacing: { before: 0, after: 0 } }),
        new Paragraph({ text: '', spacing: { before: 0, after: 0 } }),
        firmasTable,
    ];
}
