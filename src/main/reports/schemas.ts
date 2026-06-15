import type { ReportField } from './types';

export const EQUIPOS_SCHEMA: Record<string, ReportField[]> = {
    pc: [
        { key: 'tarjetaMadre', label: 'Tarjeta Madre', type: 'text', placeholder: 'Ej. ASUS PRIME B560M', group: 'Componentes' },
        { key: 'procesador', label: 'Procesador', type: 'text', placeholder: 'Ej. Intel i7 11700', group: 'Componentes' },
        { key: 'memoria', label: 'Memoria', type: 'text', placeholder: 'Ej. 8GB DDR4', group: 'Componentes' },
        { key: 'discoDuro', label: 'Disco Duro', type: 'text', placeholder: 'Ej. 500GB SSD', group: 'Componentes' },
        { key: 'fuentePoder', label: 'Fuente de Poder', type: 'text', placeholder: 'Ej. 500W ATX', group: 'Componentes' },
        { key: 'unidadOptica', label: 'Unidad Óptica', type: 'text', placeholder: 'Ej. LG DVD-RW', group: 'Componentes' }
    ],
    regulador: [
        { key: 'fase', label: 'Fase', type: 'text', placeholder: 'Ej. Bifásico', group: 'Especificaciones' },
        { key: 'voltaje', label: 'Voltaje Salida', type: 'text', placeholder: 'Ej. 110V', group: 'Especificaciones' },
        { key: 'estadoBateria', label: 'Estado de Batería', type: 'text', placeholder: 'Ej. Bueno', group: 'Especificaciones' }
    ]
};
