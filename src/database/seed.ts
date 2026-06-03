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

    dbConn.run('DELETE FROM actividad_log');
    dbConn.run('DELETE FROM actividades');
    dbConn.run('DELETE FROM direcciones');
    dbConn.run('DELETE FROM incidencias');

    const direcciones = [
        'Despacho del alcalde',
        'Direccion general',
        'Catastro',
        'Hacienda municipal',
        'Administracion',
        'Compras',
        'Tesorería',
        'Contabilidad',
        'Bienes municipales',
        'Presupuesto',
        'Contrataciones',
        'Prensa',
        'Desarrollo urbano',
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
        'Otros',
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
        'Soporte tecnico - Consultas o asesoria',
    ];

    const now = new Date().toISOString();
    const dirIds: string[] = [];
    const incIds: string[] = [];

    for (const nombre of direcciones) {
        const id = crypto.randomUUID();
        dirIds.push(id);
        dbConn.run('INSERT INTO direcciones (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, nombre, now, now]);
    }

    for (const nombre of incidencias) {
        const id = crypto.randomUUID();
        incIds.push(id);
        dbConn.run('INSERT INTO incidencias (id, nombre, created_at, updated_at) VALUES (?, ?, ?, ?)', [id, nombre, now, now]);
    }

    const sampleActivities = [
        { dir: 0, inc: 1, desc: 'Reparacion de equipo de audio en sala de reuniones', prioridad: 'alta', estado: 'completado', diasAtras: 45 },
        { dir: 0, inc: 0, desc: 'Instalacion de equipo de computo para nuevo personal', prioridad: 'media', estado: 'completado', diasAtras: 30 },
        { dir: 2, inc: 7, desc: 'Configuracion de red en oficina de Catastro', prioridad: 'media', estado: 'en_proceso', diasAtras: 15 },
        { dir: 3, inc: 6, desc: 'Actualizacion del sistema Siap en Hacienda', prioridad: 'critica', estado: 'completado', diasAtras: 60 },
        { dir: 17, inc: 5, desc: 'Soporte al sistema Sisap en Servicios Publicos', prioridad: 'media', estado: 'pendiente', diasAtras: 5 },
        { dir: 0, inc: 8, desc: 'Fallas en linea telefonica del Despacho', prioridad: 'alta', estado: 'completado', diasAtras: 20 },
        { dir: 15, inc: 4, desc: 'Instalacion de software en equipo de RRHH', prioridad: 'baja', estado: 'completado', diasAtras: 90 },
        { dir: 21, inc: 9, desc: 'Camara CCTV no funciona en entrada principal', prioridad: 'critica', estado: 'en_proceso', diasAtras: 8 },
        { dir: 20, inc: 3, desc: 'Asesoria tecnica para Sindicatura', prioridad: 'baja', estado: 'pendiente', diasAtras: 2 },
        { dir: 16, inc: 2, desc: 'Mantenimiento preventivo de servidores', prioridad: 'alta', estado: 'completado', diasAtras: 10 },
        { dir: 13, inc: 7, desc: 'Problemas de conectividad en Ingenieria Municipal', prioridad: 'alta', estado: 'pendiente', diasAtras: 3 },
        { dir: 22, inc: 0, desc: 'Instalacion de equipo en OAC', prioridad: 'media', estado: 'completado', diasAtras: 25 },
    ];

    for (const act of sampleActivities) {
        const id = crypto.randomUUID();
        const createdAt = new Date(Date.now() - act.diasAtras * 24 * 60 * 60 * 1000).toISOString();
        const updatedAt = createdAt;
        const resolvedAt = act.estado === 'completado'
            ? new Date(Date.now() - (act.diasAtras - 2) * 24 * 60 * 60 * 1000).toISOString()
            : null;
        dbConn.run(
            'INSERT INTO actividades (id, direccion_id, incidencia_id, descripcion, created_at, updated_at, estado, prioridad, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, dirIds[act.dir], incIds[act.inc], act.desc, createdAt, updatedAt, act.estado, act.prioridad, resolvedAt]
        );
    }

    db.save();

    console.log(`Seed completado: ${direcciones.length} direcciones, ${incidencias.length} incidencias, ${sampleActivities.length} actividades`);
    app.quit();
});
