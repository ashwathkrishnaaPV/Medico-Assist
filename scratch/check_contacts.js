const { pool } = require('../server/src/db');

(async () => {
  try {
    const res = await pool.query("SELECT id, email, role, student_id, staff_id, data FROM users");
    const profs = await pool.query("SELECT id, student_id, name, data FROM student_profiles");

    const profMap = {};
    for (const p of profs.rows) {
      if (p.student_id) profMap[p.student_id] = p.data;
    }

    console.log(`Total users: ${res.rows.length}, Total profiles: ${profs.rows.length}`);

    const usersWithPassword = [];
    for (const u of res.rows) {
      const prof = u.student_id ? profMap[u.student_id] : null;
      const phone = prof?.phone || u.data?.phone || u.data?.contact || prof?.emergencyContact?.phone || null;
      let last4 = null;
      if (phone) {
        const digits = String(phone).replace(/\D/g, '');
        if (digits.length >= 4) {
          last4 = digits.slice(-4);
        }
      }
      usersWithPassword.push({
        id: u.id,
        email: u.email,
        role: u.role,
        studentId: u.student_id,
        phone,
        last4,
        expectedPassword: last4 ? `sece@${last4}` : 'NO_LAST4'
      });
    }

    console.log('\nUsers without last4:');
    const withoutLast4 = usersWithPassword.filter(u => !u.last4);
    console.table(withoutLast4);

    console.log('\nSample users with expected password:');
    console.table(usersWithPassword.slice(0, 15));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();

