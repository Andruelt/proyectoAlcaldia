import { InformeTecnicoTemplate } from '../main/reports/templates/informe-tecnico';
import { formatFechaCorta, todayIso } from '../main/reports/date-format';
import * as fs from 'fs';
import * as path from 'path';

const dataInformeSimple = {
    modo: 'simple',
    fecha: '2025-12-02',
    numeroInforme: '042',
    destinatarioNombre: 'Abg. KARLA SOCORRO',
    destinatarioCargo: 'DIRECTORA DE RRHH',
    destinatarioDpto: 'ALCALDIA DE INFANTE',
    codigoBien: 'REGU-0049',
    descripcion: 'Regulador, Modelo Integra, Color Beige y Violeta',
    requerimiento: 'Diagnóstico de equipos en condición: NO OPERATIVO',
    diagnostico: 'El regulador no funciona por daños en sus partes electrónicas.',
    firma1: 'INFORMATICA Y SISTEMA',
    firma2: 'DIVISION DE REGISTRO Y CONTROL DE BIENES',
    firma3: 'RECIBIDO POR:',
};

const dataInformeDetallado = {
    modo: 'detallado',
    fecha: '2025-10-06',
    numeroInforme: '031',
    destinatarioNombre: 'Lic, MIGUEL VALI',
    destinatarioCargo: 'DIRECTOR DE ADMINISTRACION',
    destinatarioDpto: 'ALCALDIA DE INFANTE',
    codigoBien: 'PC-5015',
    descripcion: 'PC, Modelo DELL Optiplex 7010, S/N: PCI70071057, Color Negro',
    requerimiento: 'Diagnóstico de equipos en condición: Operativo.',
    componenteTarjetaMadre: 'OPERATIVO',
    componenteProcesador: 'OPERATIVO',
    componenteMemoria: 'OPERATIVO',
    componenteDiscoDuro: 'OPERATIVO',
    componenteFuentePoder: 'OPERATIVO',
    componenteUnidadOptica: 'OPERATIVO',
    diagnostico: 'PC de contabilidad, Solmany Machuca, mantenimiento por fallas operativa.',
    firma1: 'INFORMATICA Y SISTEMA',
    firma2: 'DIVISION DE REGISTRO Y CONTROL DE BIENES',
    firma3: 'RECIBIDO POR:',
};

const ctx = {
    fecha: formatFechaCorta('2025-12-02'),
    numeroInforme: '042',
};

const outDir = path.join(__dirname, '..', '..', 'tmp-test');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const previewSimple = InformeTecnicoTemplate.renderPreview(dataInformeSimple, ctx);
const pdfSimple = InformeTecnicoTemplate.renderPdfHtml(dataInformeSimple, ctx);
fs.writeFileSync(path.join(outDir, 'preview-informe-simple.html'), previewSimple);
fs.writeFileSync(path.join(outDir, 'pdf-informe-simple.html'), pdfSimple);

const previewDetallado = InformeTecnicoTemplate.renderPreview(dataInformeDetallado, ctx);
const pdfDetallado = InformeTecnicoTemplate.renderPdfHtml(dataInformeDetallado, ctx);
fs.writeFileSync(path.join(outDir, 'preview-informe-detallado.html'), previewDetallado);
fs.writeFileSync(path.join(outDir, 'pdf-informe-detallado.html'), pdfDetallado);

console.log('Test Informe Técnico:');
console.log('  Modo simple - Preview length:', previewSimple.length, 'chars');
console.log('  Modo simple - PDF length:', pdfSimple.length, 'chars');
console.log('  Modo detallado - Preview length:', previewDetallado.length, 'chars');
console.log('  Modo detallado - PDF length:', pdfDetallado.length, 'chars');
console.log('  Output:', outDir);

console.log('\n[OK] Tests completados');
