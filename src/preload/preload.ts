import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
    sendToMain: (channel: string, data: unknown) => ipcRenderer.send(channel, data),
    onRenderView: (callback: (html: string) => void) => {
        ipcRenderer.on('render-view', (event, html) => callback(html));
    },
    onMessage: (channel: string, callback: (data: unknown) => void) => {
        ipcRenderer.on(channel, (event, data) => callback(data));
    },
    invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data),
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);