export async function safeInvoke(channel, data) {
    if (!window.electronAPI) {
        throw new Error('electronAPI no disponible. Verifique que el preload script se cargó correctamente.');
    }
    return window.electronAPI.invoke(channel, data);
}
