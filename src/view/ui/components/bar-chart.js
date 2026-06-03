'use strict';

import { tokens } from '../tokens.js';
import { BaseChart } from '../base/BaseChart.js';

const t = tokens;

export class BarChart extends BaseChart {
    render() {
        const data = this.getAttribute('data') || '30,50,40,70,60,80,55';
        const bars = data.split(',').map(Number);
        const max = Math.max(...bars);

        const width = 100;
        const height = 52;
        let barsSvg = '';
        const barWidth = width / bars.length * 0.55;
        const spacing = width / bars.length;

        bars.forEach((val, i) => {
            const barHeight = (val / max) * height * 0.85;
            const x = i * spacing + spacing / 2 - barWidth / 2;
            const y = height - barHeight;
            barsSvg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${t.colors.accent}" rx="2"/>`;
        });

        this.renderChart(barsSvg, 60);
    }
}
