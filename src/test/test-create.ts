import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseAdapter } from '../database/database';

async function runTests(): Promise<void> {
    await app.whenReady();

    const testDbPath = path.join(app.getPath('userData'), 'test_create.db');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, msg: string): void {
        if (condition) { passed++; console.log(`  PASS: ${msg}`); }
        else { failed++; console.error(`  FAIL: ${msg}`); }
    }

    try {
        const db = DatabaseAdapter.getInstance();
        await db.connect('test_create.db');
        db.initTables();

        console.log('\n=== Create: Direcciones ===');
        const dirId = db.addDireccion('Dirección de Test');
        assert(typeof dirId === 'string' && dirId.length > 0, 'addDireccion retorna ID válido');

        const dirs = db.getDirecciones();
        assert(dirs.length === 1, 'getDirecciones retorna 1 registro');
        assert(dirs[0].nombre === 'Dirección de Test', 'getDirecciones retorna nombre correcto');
        assert(dirs[0].id === dirId, 'getDirecciones retorna ID correcto');

        try {
            db.addDireccion('');
            assert(false, 'addDireccion("") debería lanzar error');
        } catch {
            assert(true, 'addDireccion("") lanza error');
        }

        try {
            db.addDireccion('   ');
            assert(false, 'addDireccion("   ") debería lanzar error');
        } catch {
            assert(true, 'addDireccion("   ") lanza error');
        }

        console.log('\n=== Create: Incidencias ===');
        const incId = db.addIncidencia('Incidencia de Test');
        assert(typeof incId === 'string' && incId.length > 0, 'addIncidencia retorna ID válido');

        const incs = db.getIncidencias();
        assert(incs.length === 1, 'getIncidencias retorna 1 registro');
        assert(incs[0].nombre === 'Incidencia de Test', 'getIncidencias retorna nombre correcto');

        console.log('\n=== Create: Actividades ===');
        const actId = db.addActividad(dirId, incId, 'Actividad de test');
        assert(typeof actId === 'string' && actId.length > 0, 'addActividad retorna ID válido');

        const acts = db.getActividades();
        assert(acts.length === 1, 'getActividades retorna 1 registro');
        assert(acts[0].direccion === 'Dirección de Test', 'getActividades retorna dirección en JOIN');
        assert(acts[0].incidencia === 'Incidencia de Test', 'getActividades retorna incidencia en JOIN');

        // Soft-delete cascade: actividad no debe aparecer si su dirección fue eliminada
        db.deleteDireccion(dirId);
        const actsAfter = db.getActividades();
        assert(actsAfter.length === 0, 'Actividad oculta al eliminar su dirección (soft-delete cascade)');

        console.log('\n=== Update ===');
        const dirId2 = db.addDireccion('Original');
        db.updateDireccion(dirId2, 'Actualizada');
        const dirs2 = db.getDirecciones();
        assert(dirs2.find(d => d.id === dirId2)?.nombre === 'Actualizada', 'updateDireccion cambia el nombre');

        const incId2 = db.addIncidencia('Original inc');
        db.updateIncidencia(incId2, 'Actualizada inc');
        const incs2 = db.getIncidencias();
        assert(incs2.find(i => i.id === incId2)?.nombre === 'Actualizada inc', 'updateIncidencia cambia el nombre');

        console.log('\n=== Soft Delete ===');
        db.deleteIncidencia(incId2);
        const incs3 = db.getIncidencias();
        assert(incs3.every(i => i.id !== incId2), 'deleteIncidencia oculta registro (soft-delete)');

        db.close();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    } catch (err: any) {
        console.error('\nFATAL:', err.message);
        console.error(err.stack);
        failed++;
    }

    console.log(`\n${'='.repeat(40)}`);
    console.log(`Resultado: ${passed} PASS, ${failed} FAIL`);
    console.log(`${'='.repeat(40)}\n`);

    app.exit(failed > 0 ? 1 : 0);
}

runTests();
