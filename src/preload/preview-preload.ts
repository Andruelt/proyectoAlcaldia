import { contextBridge, ipcRenderer } from 'electron';

const previewAPI = {
    onData: (callback: (payload: unknown) => void) => {
        const handler = (_event: unknown, payload: unknown) => callback(payload);
        ipcRenderer.on('preview-data', handler);
        return () => ipcRenderer.removeListener('preview-data', handler);
    },
    ready: () => ipcRenderer.send('preview-ready'),
};

contextBridge.exposeInMainWorld('previewAPI', previewAPI);
