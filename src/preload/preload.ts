import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    sendToMain: (channel: string, data: unknown) => ipcRenderer.send(channel, data),
    onRenderView: (callback: (html: string) => void) => {
        ipcRenderer.on('render-view', (event, html) => callback(html));
    },
    onMessage: (channel: string, callback: (data: unknown) => void) => {
        ipcRenderer.on(channel, (event, data) => callback(data));
    },
    invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data),
});