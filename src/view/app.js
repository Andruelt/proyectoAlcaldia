'use strict';

console.log('[app] bootstrap');

window.addEventListener('error', (e) => console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', (e) => console.error('[UNHANDLED REJECTION]', e.reason));

import { onNavigate, navigate, showView, initSidebar } from './modules/router.js';
import { initDirecciones, initIncidencias, refreshSelects } from './modules/crud.js';
import { initActividades, setOnChange, loadActividades } from './modules/actividades.js';
import { loadDashboard, initDashboardFilters } from './modules/dashboard.js';
import { loadAnalytics, initAnalyticsButtons } from './modules/analytics.js';
import { initInformeEditor } from './modules/informe.js';

const VIEW_LOADERS = {
    inicio: async () => { await loadDashboard(); await loadAnalytics(); },
    actividades: async () => { await loadActividades(); await refreshSelects(); },
    informe: () => initInformeEditor(),
    direcciones: () => initDirecciones(),
    incidencias: () => initIncidencias(),
    configuracion: () => refreshSelects(),
};

function setupNavigation() {
    document.getElementById('cfg-direcciones')?.addEventListener('action', () => navigate('direcciones'));
    document.getElementById('cfg-incidencias')?.addEventListener('action', () => navigate('incidencias'));

    onNavigate(async (view) => {
        const loader = VIEW_LOADERS[view];
        if (loader) {
            try { await loader(); } catch (err) { console.error(`[nav] ${view} error:`, err); }
        }
    });
}

function setupImprimir() {
    document.getElementById('btn-imprimir')?.addEventListener('action', () => window.print());
}

document.addEventListener('DOMContentLoaded', async () => {
    showView('inicio');
    initSidebar();
    setupNavigation();
    setupImprimir();

    initDirecciones();
    initIncidencias();
    setOnChange(refreshSelects);
    initActividades();
    initDashboardFilters();
    initAnalyticsButtons();

    await loadDashboard();
    await loadAnalytics();
    await refreshSelects();
});
