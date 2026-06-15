import type { BrowserWindow, IpcMain } from 'electron';
import { dialog } from 'electron';
import * as fs from 'fs';
import { generateReport, generateListPdf, generateListWord, type GenerateRequest } from '../main/reports/generator';
import { withLogging } from './index';
import { EQUIPOS_SCHEMA } from '../main/reports/schemas';

export interface ListExportRequest {
    actividades: Array<{ id: string; direccion: string; incidencia: string; descripcion?: string; created_at: string }>;
    filterLabel: string;
    format: 'pdf' | 'docx';
}

export function registerReportHandlers(ipc: IpcMain, window: BrowserWindow | null): void {
    ipc.handle('generate-report', withLogging('generate-report', async (req: GenerateRequest) => {
        if (!window) return { canceled: true };
        const ext = req.format === 'pdf' ? 'pdf' : 'docx';
        const defaultName = `${req.templateId}-${Date.now()}.${ext}`;
        const { filePath, canceled } = await dialog.showSaveDialog(window, {
            title: req.format === 'pdf' ? 'Exportar PDF' : 'Exportar Word',
            defaultPath: defaultName,
            filters: [{ name: req.format === 'pdf' ? 'PDF' : 'Word', extensions: [ext] }],
        });
        if (canceled || !filePath) return { canceled: true };
        const buffer = await generateReport(req);
        fs.writeFileSync(filePath, buffer);
        return { filePath };
    }));

    ipc.handle('export-pdf', withLogging('export-pdf', async (args: { actividades: ListExportRequest['actividades']; filterLabel: string }) => {
        if (!window) return { canceled: true };
        const { filePath, canceled } = await dialog.showSaveDialog(window, {
            title: 'Exportar PDF',
            defaultPath: `informe-${Date.now()}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
        });
        if (canceled || !filePath) return { canceled: true };
        const buffer = await generateListPdf(args.actividades, args.filterLabel);
        fs.writeFileSync(filePath, buffer);
        return { filePath };
    }));

    ipc.handle('export-word', withLogging('export-word', async (args: { actividades: ListExportRequest['actividades']; filterLabel: string }) => {
        if (!window) return { canceled: true };
        const { filePath, canceled } = await dialog.showSaveDialog(window, {
            title: 'Exportar Word',
            defaultPath: `informe-${Date.now()}.docx`,
            filters: [{ name: 'Word', extensions: ['docx'] }],
        });
        if (canceled || !filePath) return { canceled: true };
        const buffer = await generateListWord(args.actividades, args.filterLabel);
        fs.writeFileSync(filePath, buffer);
        return { filePath };
    }));

    ipc.handle('get-equipos-schema', withLogging('get-equipos-schema', async () => {
        return EQUIPOS_SCHEMA;
    }));
}
