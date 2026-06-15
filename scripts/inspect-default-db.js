const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

(async () => {
    const dbPath = path.join(process.env.APPDATA || '', 'proyecto-alcaldia', 'database.db');
    console.log('Looking for DB at:', dbPath);
    if (!fs.existsSync(dbPath)) {
        console.error('DB file not found at default location.');
        process.exit(1);
    }
    try {
        const SQL = await initSqlJs();
        const data = fs.readFileSync(dbPath);
        const db = new SQL.Database(data);
        const res = db.exec("SELECT id, tipo_equipo, datos_tecnicos, created_at FROM actividades ORDER BY created_at DESC LIMIT 200");
        if (!res || res.length === 0) {
            console.log('No rows returned.');
            process.exit(0);
        }
        const columns = res[0].columns;
        const values = res[0].values;
        console.log(columns.join('\t'));
        for (const row of values) {
            const obj = {};
            for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
            let dt = obj.datos_tecnicos;
            if (dt && typeof dt === 'string') {
                try { dt = JSON.parse(dt); } catch { /* leave as string */ }
            }
            console.log(obj.id + '\t' + (obj.tipo_equipo || '') + '\t' + (typeof dt === 'object' ? JSON.stringify(dt) : (dt || '')) + '\t' + obj.created_at);
        }
    } catch (err) {
        console.error('Error inspecting DB:', err);
        process.exit(2);
    }
})();
