const { generateReport } = require('../dist/main/reports/generator');
const fs = require('fs');

async function run() {
    const sampleData = {
        fecha: new Date().toISOString(),
        destinatarioNombre: 'Juan Perez',
        destinatarioCargo: 'Director',
        destinatarioDpto: 'Informática',
        numeroInforme: '0001',
        descripcion: 'Prueba generador',
        diagnostico: 'Funcionamiento correcto',
        modo: 'detallado',
        datos_tecnicos: JSON.stringify({ modelo: 'PC-1000', procesador: 'Intel i5', memoria: '8GB' })
    };
    const actividad = { id: 'test-1', direccion: 'Despacho', incidencia: 'Instalacion', created_at: new Date().toISOString() };
    try {
        const docxBuf = await generateReport({ templateId: 'informe-tecnico', format: 'docx', data: sampleData, actividad });
        fs.mkdirSync('dist/test', { recursive: true });
        fs.writeFileSync('dist/test/out-test-docx-only.docx', docxBuf);
        console.log('Wrote dist/test/out-test-docx-only.docx');
    } catch (err) {
        console.error('Docx-only generation failed:', err);
        process.exit(2);
    }
}

run();
