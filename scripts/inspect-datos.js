const initSqlJs = require('sql.js');
const fs = require('fs');

if (process.argv.length < 3) {
    console.error('Usage: node scripts/inspect-datos.js <path-to-db-file>');
    process.exit(2);
}

const dbPath = process.argv[2];
if (!fs.existsSync(dbPath)) {
    console.error('DB file not found:', dbPath);
    process.exit(2);
}

(async () => {
    try {
        const SQL = await initSqlJs();
        const data = fs.readFileSync(dbPath);
        const db = new SQL.Database(data);
        const res = db.exec("SELECT id, tipo_equipo, datos_tecnicos, created_at FROM actividades ORDER BY created_at DESC LIMIT 200");
        if (!res || res.length === 0) {
            console.log('No rows returned.');
            return;
        }
        const columns = res[0].columns;
        const values = res[0].values;
        console.log(columns.join('\t'));
        for (const row of values) {
            const obj = {};
            for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
            // try parse datos_tecnicos
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
