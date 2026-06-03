import { BrowserWindow } from 'electron';
import {
    Document, Packer, Paragraph, Table, TableRow, TableCell,
    TextRun, WidthType, AlignmentType, HeadingLevel, BorderStyle
} from 'docx';

export interface ActividadExport {
    id: string;
    direccion: string;
    incidencia: string;
    descripcion: string;
    created_at: string;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function shortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function buildReportHtml(actividades: ActividadExport[], filterLabel: string): string {
    const now = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const rows = actividades.map(a => `
        <tr>
            <td>${escapeHtml(a.direccion)}</td>
            <td>${escapeHtml(a.incidencia)}</td>
            <td>${escapeHtml(a.descripcion || '—')}</td>
            <td>${shortDate(a.created_at)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    @page {
        margin: 25mm 20mm;
        @bottom-right {
            content: counter(page) " / " counter(pages);
            font-size: 9px;
            color: #94a3b8;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Segoe UI', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        color: #1e293b; font-size: 11px; line-height: 1.5;
    }
    h1 {
        font-size: 22px; font-weight: 700; color: #0f172a;
        margin-bottom: 4px; letter-spacing: -0.02em;
    }
    .subtitle {
        font-size: 13px; color: #64748b; margin-bottom: 24px;
        border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;
    }
    .meta {
        display: flex; justify-content: space-between;
        font-size: 10px; color: #94a3b8; margin-bottom: 20px;
    }
    table {
        width: 100%; border-collapse: collapse;
        font-size: 10px; margin-bottom: 24px;
    }
    thead th {
        background: #f8fafc; text-align: left;
        padding: 8px 10px; font-size: 9px;
        text-transform: uppercase; letter-spacing: 0.06em;
        color: #64748b; font-weight: 600;
        border-bottom: 2px solid #e2e8f0;
    }
    tbody td {
        padding: 7px 10px; border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    tbody tr:nth-child(even) td {
        background: #fafbfc;
    }
    .desc-cell { color: #64748b; }
    .footer {
        margin-top: 32px; padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        font-size: 9px; color: #94a3b8;
    }
    .total {
        margin-top: 12px; font-size: 11px; color: #475569;
        font-weight: 600;
    }
</style>
</head>
<body>
    <h1>Informe Técnico de Actividades</h1>
    <div class="subtitle">${escapeHtml(filterLabel)}</div>
    <div class="meta">
        <span>Generado: ${now}</span>
        <span>Total: ${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}</span>
    </div>
    <table>
        <thead>
            <tr>
                <th>Dirección</th>
                <th>Incidencia</th>
                <th>Descripción</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8;">No hay actividades</td></tr>'}
        </tbody>
    </table>
    <div class="total">Total: ${actividades.length} registro${actividades.length !== 1 ? 's' : ''}</div>
    <div class="footer">Documento generado el ${now} &mdash; Sistema de Gestión Municipal</div>
</body>
</html>`;
}

export async function generatePdf(
    actividades: ActividadExport[],
    filterLabel: string
): Promise<Buffer> {
    const html = buildReportHtml(actividades, filterLabel);

    const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    try {
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        const pdf = await win.webContents.printToPDF({
            printBackground: true,
            preferCSSPageSize: true,
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });
        return Buffer.from(pdf);
    } finally {
        if (!win.isDestroyed()) win.close();
    }
}

export async function generateWord(
    actividades: ActividadExport[],
    filterLabel: string
): Promise<Buffer> {
    const now = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const headerRow = new TableRow({
        tableHeader: true,
        children: ['Dirección', 'Incidencia', 'Descripción', 'Fecha'].map(text =>
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text, bold: true, size: 18, color: '475569' })],
                    spacing: { before: 40, after: 40 }
                })],
                width: { size: text === 'Descripción' ? 40 : 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F8FAFC', type: 'clear' }
            })
        )
    });

    const dataRows = actividades.map(a =>
        new TableRow({
            children: [a.direccion, a.incidencia, a.descripcion || '—', shortDate(a.created_at)].map(text =>
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text, size: 18, color: '334155' })],
                        spacing: { before: 30, after: 30 }
                    })]
                })
            )
        })
    );

    const table = new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'F1F5F9' }
        }
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Segoe UI', size: 20, color: '1E293B' },
                    paragraph: { spacing: { after: 120 } }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
                }
            },
            children: [
                new Paragraph({
                    children: [new TextRun({ text: 'Informe Técnico de Actividades', bold: true, size: 36, color: '0F172A' })],
                    spacing: { after: 40 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: filterLabel, size: 22, color: '64748B' })],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Generado: ${now}`, size: 16, color: '94A3B8' }),
                        new TextRun({ text: `    |    Total: ${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`, size: 16, color: '94A3B8' })
                    ],
                    spacing: { after: 200 }
                }),
                table,
                new Paragraph({
                    children: [new TextRun({ text: `Total: ${actividades.length} registro${actividades.length !== 1 ? 's' : ''}`, bold: true, size: 18, color: '475569' })],
                    spacing: { before: 200 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Documento generado el ${now} — Sistema de Gestión Municipal`, size: 16, color: '94A3B8' })],
                    spacing: { before: 300 },
                    border: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }
                    }
                })
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
}
