const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'freshbite'
});

(async () => {
    try {
        const conn = await db.getConnection();
        console.log("MySQL Connected ✅");
        conn.release();
    } catch (err) {
        console.log("DB connection failed ❌", err);
    }
})();

module.exports = db;