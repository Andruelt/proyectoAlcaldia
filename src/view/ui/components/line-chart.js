'use strict';

import { BaseChart } from '../base/BaseChart.js';

export class LineChart extends BaseChart {
    render() {
        const data = this.getAttribute('data') || '10,25,15,30,20,35,25';
        const points = data.split(',').map(Number);
        const max = Math.max(...points);
        const min = Math.min(...points);
        const range = max - min || 1;

        const width = 100;
        const height = 60;
        const stepX = width / (points.length - 1);

        let pathD = '';
        let areaD = `M 0,${height} `;

        points.forEach((val, i) => {
            const x = i * stepX;
            const y = height - ((val - min) / range) * height * 0.9 - height * 0.05;
            pathD += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
            areaD += `L ${x},${y} `;
        });
        areaD += `L ${width},${height} Z`;

        const svg = `<path class="chart-area" d="${areaD}"/><path class="chart-line" d="${pathD}"/>`;
        this.renderChart(svg, 80);
    }
}
