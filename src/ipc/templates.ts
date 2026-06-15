import type { IpcMain } from 'electron';
import { withLogging } from './index';
import { listAvailableTemplates } from '../main/reports/generator';

export function registerTemplateHandlers(ipc: IpcMain): void {
    ipc.handle('get-report-templates', withLogging('get-report-templates', () => {
        return listAvailableTemplates();
    }));
}
