export {};

declare global {
    interface Window {
        electronAPI: {
            invoke(channel: string, ...args: unknown[]): Promise<any>;
            on(channel: string, callback: (data: unknown) => void): void;
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
            reports: {
                templates(): Promise<Array<{
                    id: string;
                    name: string;
                    description: string;
                    icon: string;
                    fields: Array<{
                        key: string;
                        label: string;
                        type: string;
                        placeholder?: string;
                        required?: boolean;
                        rows?: number;
                        maxLength?: number;
                        group?: string;
                    }>;
                }>>;
                generate(data: {
                    templateId: string;
                    format: 'pdf' | 'docx';
                    data: Record<string, string>;
                    actividad?: unknown;
                    filterLabel?: string;
                }): Promise<{ filePath?: string; canceled?: boolean }>;
            };
        };
    }
}
