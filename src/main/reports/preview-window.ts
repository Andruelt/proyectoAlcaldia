import { BrowserWindow } from 'electron';
import * as path from 'path';

let previewWindow: BrowserWindow | null = null;

const LISTENERS = new Set<(open: boolean) => void>();

export function onPreviewWindowChange(cb: (open: boolean) => void): () => void {
    LISTENERS.add(cb);
    return () => LISTENERS.delete(cb);
}

function notify(open: boolean) {
    for (const cb of LISTENERS) {
        try { cb(open); } catch { /* ignore */ }
    }
}

export function isPreviewWindowOpen(): boolean {
    return previewWindow !== null && !previewWindow.isDestroyed();
}

export function openPreviewWindow(): BrowserWindow {
    if (previewWindow && !previewWindow.isDestroyed()) {
        previewWindow.focus();
        return previewWindow;
    }

    previewWindow = new BrowserWindow({
        width: 900,
        height: 1200,
        minWidth: 500,
        minHeight: 600,
        title: 'Vista previa',
        backgroundColor: '#f1f5f9',
        autoHideMenuBar: true,
        titleBarStyle: 'default',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preview-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    previewWindow.once('ready-to-show', () => {
        previewWindow?.show();
    });

    previewWindow.loadFile(path.join(__dirname, '../view/preview.html'));

    previewWindow.on('closed', () => {
        previewWindow = null;
        notify(false);
    });

    notify(true);
    return previewWindow;
}

export function closePreviewWindow(): void {
    if (previewWindow && !previewWindow.isDestroyed()) {
        previewWindow.close();
    }
    previewWindow = null;
}

export function togglePreviewWindow(): boolean {
    if (isPreviewWindowOpen()) {
        closePreviewWindow();
        return false;
    }
    openPreviewWindow();
    return true;
}

export function sendPreviewData(payload: unknown): boolean {
    if (!previewWindow || previewWindow.isDestroyed()) return false;
    previewWindow.webContents.send('preview-data', payload);
    return true;
}
