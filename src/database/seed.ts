import { app } from 'electron';
import { DatabaseAdapter } from './database';

app.whenReady().then(async () => {
    const db = DatabaseAdapter.getInstance();
    await db.connect('alcaldia.db');
    db.initTables();

    if (!db.getConnection()) {
        console.error('No se pudo conectar a la base de datos');
        app.quit();
        return;
    }

    const dbConn = db.getConnection()!;

    dbConn.run('DELETE FROM actividades');
    dbConn.run('DELETE FROM direcciones');
    dbConn.run('DELETE FROM incidencias');

    const direcciones = [
        'Despacho del alcade',
        'Direccion general',
        'Castastro',
        'Hacienda municipal',
        'Administracion',
        'Compras',
        'Tesoreia',
        'Contabilidad',
        'Bienes municipales',
        'Presupuesto',
        'Contrataciones',
        'Prensa',
        'Desarrrolo urbano',
        'Ingenieria municipal',
        'Planificacion',
        'Recursos humanos',
        'Informatica',
        'Servicios publicos',
        'Desarrollo social',
        'Consejo municipal',
        'Sindicatura',
        'Seguridad ciudadana',
        'OAC',
        'Inmuvin',
        'Fondemin',
        'Iamdeim',
        'Cejarca',
        'Iapatmi',
        'Cllp',
        'Registro civil',
        'Registro civil del hospital',
        'Otros'
    ];

    const incidencias = [
        'Instalacion de equipo',
        'Reparacion de equipo',
        'Mantenimiento de equipo',
        'Soporte tecnico o asesorias',
        'Instalacion de software/Configuracion de equipo',
        'Sistema sisap',
        'Sistema Siap',
        'Red e internet',
        'Telefonia y comunicaciones',
        'CCTV',
        'Otros',
        'Soporte tecnico - Reparaciones o Mantenimiento',
        'Soporte tecnico - Consultas o asesoria'
    ];

    const now = new Date().toISOString();

    for (const nombre of direcciones) {
        dbConn.run('INSERT INTO direcciones (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), nombre, now, now]);
    }

    for (const nombre of incidencias) {
        dbConn.run('INSERT INTO incidencias (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), nombre, now, now]);
    }

    db.save();

    console.log(`Seed completado: ${direcciones.length} direcciones, ${incidencias.length} incidencias`);
    app.quit();
});
