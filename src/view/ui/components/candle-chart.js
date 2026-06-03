'use strict';

import { tokens } from '../tokens.js';
import { BaseChart } from '../base/BaseChart.js';

const t = tokens;

export class CandleChart extends BaseChart {
    render() {
        const data = this.getAttribute('data') || '100,105:95,110:90,115:85,120:100,125:95,130:110';

        const candles = data.split(' ').map(item => {
            const [o, h, l, cl] = item.split(':').map(Number);
            return { open: o, high: h, low: l, close: cl };
        });

        const allPrices = candles.flatMap(c => [c.high, c.low]);
        const max = Math.max(...allPrices);
        const min = Math.min(...allPrices);
        const range = max - min || 1;

        const width = 100;
        const height = 64;
        const barWidth = width / candles.length * 0.5;

        let svgContent = '';

        candles.forEach((c, i) => {
            const x = i * (width / candles.length) + width / candles.length / 2;
            const isGreen = c.close >= c.open;
            const color = isGreen ? t.colors.accent : t.colors.textSecondary;

            const yHigh = height - ((c.high - min) / range) * height * 0.85 - height * 0.07;
            const yLow = height - ((c.low - min) / range) * height * 0.85 - height * 0.07;
            const yOpen = height - ((c.open - min) / range) * height * 0.85 - height * 0.07;
            const yClose = height - ((c.close - min) / range) * height * 0.85 - height * 0.07;

            svgContent += `
                <line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1"/>
                <rect x="${x - barWidth/2}" y="${Math.min(yOpen, yClose)}" width="${barWidth}" height="${Math.max(Math.abs(yClose - yOpen), 2)}" fill="${color}" rx="1"/>
            `;
        });

        this.renderChart(svgContent, 64);
    }
}
