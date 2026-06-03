'use strict';

import { tokens } from '../tokens.js';
import { BaseComponent } from './BaseComponent.js';

const t = tokens;

export class BaseChart extends BaseComponent {
    static get observedAttributes() { return ['data', 'title']; }
    attributeChangedCallback() { this.render(); }

    renderChart(svgInnerHTML, svgViewBoxHeight = 80) {
        const title = this.getAttribute('title') || '';
        this.shadowRoot.innerHTML = `<style>
                :host { display: block; background: ${t.colors.bg}; border-radius: ${t.radius.sm}; padding: ${t.chart.padding}; }
                .chart-title { font-size: ${t.font.sizeSm}; font-weight: ${t.font.weightNormal}; color: ${t.colors.textSecondary}; font-family: ${t.font.family}; margin-bottom: 20px; }
                .chart-area { fill: ${t.colors.chartArea}; }
                .chart-line { fill: none; stroke: ${t.colors.accent}; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
                svg { width: 100%; }
            </style>
            <div class="chart-container">
                <div class="chart-title">${title}</div>
                <svg viewBox="0 0 100 ${svgViewBoxHeight}" preserveAspectRatio="none">${svgInnerHTML}</svg>
            </div>`;
    }
}
