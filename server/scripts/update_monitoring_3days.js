const { pool } = require('../src/db');

(async () => {
  try {
    const res = await pool.query('SELECT id, student_id, data FROM monitoring_plans');
    for (const row of res.rows) {
      const updatedData = {
        ...row.data,
        durationDays: 3,
        createdBy: 'Dr. Nivetha M.B.B.S',
        updatedAt: new Date().toISOString()
      };
      await pool.query(
        'UPDATE monitoring_plans SET data = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updatedData), row.id]
      );
      console.log(`✅ Updated monitoring plan ${row.id} (Student: ${row.student_id}) to 3 days.`);
    }
    console.log('🎉 Done updating monitoring plans to 3 days in PostgreSQL.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();

