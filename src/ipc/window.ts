import type { BrowserWindow, IpcMain } from 'electron';
import { withLogging } from './index';

export function registerWindowHandlers(ipc: IpcMain, window: BrowserWindow | null): void {
    ipc.handle('window-minimize', withLogging('window-minimize', () => {
        window?.minimize();
    }));
    ipc.handle('window-maximize', withLogging('window-maximize', () => {
        if (!window) return;
        if (window.isMaximized()) window.unmaximize();
        else window.maximize();
    }));
    ipc.handle('window-close', withLogging('window-close', () => {
        window?.close();
    }));
    ipc.handle('window-is-maximized', withLogging('window-is-maximized', () => {
        return window?.isMaximized() ?? false;
    }));
}
