'use strict';

import './date-utils.js';
import './registry.js';

window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('navigate', (e) => {
        const viewName = e.detail.view;
        document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('nav-menu-item').forEach(item => item.removeAttribute('active'));
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) targetView.classList.add('active');
        const targetNav = document.querySelector(`nav-menu-item[view="${viewName}"]`);
        if (targetNav) targetNav.setAttribute('active', '');
    });
});
