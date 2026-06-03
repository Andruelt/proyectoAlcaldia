'use strict';

const LOCALE = 'es-VE';

function parseFecha(isoString) {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;

    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    const human = date.toLocaleDateString(LOCALE, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }) + ', ' + date.toLocaleTimeString(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
    });

    let relative;
    if (diffMin < 1) relative = 'ahora mismo';
    else if (diffMin < 60) relative = `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
    else if (diffHoras < 24) relative = `hace ${diffHoras} hora${diffHoras === 1 ? '' : 's'}`;
    else if (diffDias === 1) relative = 'ayer';
    else if (diffDias < 7) relative = `hace ${diffDias} días`;
    else if (diffDias < 30) relative = `hace ${Math.floor(diffDias / 7)} semana${Math.floor(diffDias / 7) === 1 ? '' : 's'}`;
    else relative = date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });

    const short = date.toLocaleDateString(LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return { date, human, relative, short };
}

window.DateUtils = {
    parse: parseFecha,
    human: (iso) => parseFecha(iso)?.human || iso,
    relative: (iso) => parseFecha(iso)?.relative || iso,
    short: (iso) => parseFecha(iso)?.short || iso,
};
