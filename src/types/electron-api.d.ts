export {};

declare global {
    interface Window {
        electronAPI: {
            invoke(channel: string, ...args: unknown[]): Promise<any>;
            windowControls: {
                minimize(): Promise<void>;
                maximize(): Promise<void>;
                close(): Promise<void>;
                isMaximized(): Promise<boolean>;
            };
            export: {
                pdf(data: { actividades: any[]; filterLabel: string }): Promise<{ filePath?: string; canceled?: boolean }>;
                word(data: { actividades: any[]; filterLabel: string }): Promise<{ filePath?: string; canceled?: boolean }>;
            };
        };
    }
}
