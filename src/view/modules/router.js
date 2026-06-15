export function navigate(view) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
}

export function showView(view) {
    document.querySelectorAll('.page-view').forEach(el => {
        el.classList.toggle('active', el.id === `view-${view}`);
    });
    document.querySelectorAll('nav-menu-item').forEach(el => {
        el.toggleAttribute('active', el.getAttribute('view') === view);
    });
}

export function onNavigate(handler) {
    window.addEventListener('navigate', (e) => {
        const view = e.detail?.view;
        if (view) {
            showView(view);
            handler(view);
        }
    });
}

const SIDEBAR_KEY = 'alcaldia-sidebar-collapsed';

export function isSidebarCollapsed() {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
}

export function setSidebarCollapsed(collapsed) {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
}

export function toggleSidebar() {
    setSidebarCollapsed(!isSidebarCollapsed());
    return isSidebarCollapsed();
}

export function initSidebar() {
    setSidebarCollapsed(isSidebarCollapsed());
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
        toggle.addEventListener('click', toggleSidebar);
    }
}
