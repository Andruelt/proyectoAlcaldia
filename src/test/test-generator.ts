import { generateReport } from '../main/reports/generator';
import * as fs from 'fs';
import { app } from 'electron';

async function run() {
    await app.whenReady();
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
    } as any;

    const actividad = { id: 'test-1', direccion: 'Despacho', incidencia: 'Instalacion', created_at: new Date().toISOString() } as any;

    try {
        const pdfBuf = await generateReport({ templateId: 'informe-tecnico', format: 'pdf', data: sampleData, actividad });
        fs.mkdirSync('dist/test', { recursive: true });
        fs.writeFileSync('dist/test/out-test.pdf', pdfBuf);
        console.log('Wrote dist/test/out-test.pdf');

        const docxBuf = await generateReport({ templateId: 'informe-tecnico', format: 'docx', data: sampleData, actividad });
        fs.writeFileSync('dist/test/out-test.docx', docxBuf);
        console.log('Wrote dist/test/out-test.docx');
        // quit app when done
        app.quit();
    } catch (err) {
        console.error('Test generator failed:', err);
        app.exit(2);
    }
}

run();
