import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
    invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data),
    on: (channel: string, callback: (data: unknown) => void) => {
        ipcRenderer.on(channel, (event, data) => callback(data));
    },
    windowControls: {
        minimize: () => ipcRenderer.invoke('window-minimize'),
        maximize: () => ipcRenderer.invoke('window-maximize'),
        close: () => ipcRenderer.invoke('window-close'),
        isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    },
    export: {
        pdf: (data: { actividades: any[]; filterLabel: string }) => ipcRenderer.invoke('export-pdf', data),
        word: (data: { actividades: any[]; filterLabel: string }) => ipcRenderer.invoke('export-word', data),
    },
    reports: {
        templates: () => ipcRenderer.invoke('get-report-templates'),
        generate: (data: unknown) => ipcRenderer.invoke('generate-report', data),
        schema: () => ipcRenderer.invoke('get-equipos-schema'),
    },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// reports.schema is exposed on electronAPI at creation time
