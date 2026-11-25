const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

(async () => {
  try {
    console.log('🔄 Checking users and contact numbers in PostgreSQL...');
    const usersRes = await pool.query("SELECT id, email, role, student_id, staff_id, data FROM users");
    const profsRes = await pool.query("SELECT id, student_id, name, data FROM student_profiles");

    const profMap = {};
    for (const p of profsRes.rows) {
      if (p.student_id) profMap[p.student_id] = p.data;
    }

    console.log(`Total users in DB: ${usersRes.rows.length}`);
    console.log(`Total student profiles: ${profsRes.rows.length}`);

    // Map of default contacts for roles that might not have a student profile
    const ROLE_DEFAULT_CONTACTS = {
      'admin@sece.ac.in': '9443001234', // Admin contact -> last 4: 1234 -> sece@1234
      'nivetha@sece.ac.in': '9842005678', // Dr. Nivetha contact -> last 4: 5678 -> sece@5678
      'dr.nivetha@sece.ac.in': '9842005678'
    };

    let updatedCount = 0;

    for (const u of usersRes.rows) {
      const prof = u.student_id ? profMap[u.student_id] : null;
      let phone = prof?.phone || u.data?.phone || u.data?.contact || prof?.emergencyContact?.phone || null;

      if (!phone && ROLE_DEFAULT_CONTACTS[u.email?.toLowerCase()]) {
        phone = ROLE_DEFAULT_CONTACTS[u.email?.toLowerCase()];
      }

      // If still no phone, fallback to last 4 of student_id digits or 1234
      let last4 = '1234';
      if (phone) {
        const digits = String(phone).replace(/\D/g, '');
        if (digits.length >= 4) {
          last4 = digits.slice(-4);
        }
      } else if (u.student_id) {
        const digits = String(u.student_id).replace(/\D/g, '');
        if (digits.length >= 4) {
          last4 = digits.slice(-4);
        } else if (digits.length > 0) {
          last4 = digits.padStart(4, '0');
        }
      }

      const targetPassword = `sece@${last4}`;
      const hashed = await bcrypt.hash(targetPassword, 10);

      // Update in data JSON
      const updatedData = {
        ...u.data,
        password: hashed,
        phone: phone || u.data?.phone || '944300' + last4,
        updatedAt: new Date().toISOString()
      };

      await pool.query(
        "UPDATE users SET data = $1, updated_at = NOW() WHERE id = $2",
        [JSON.stringify(updatedData), u.id]
      );

      // If student profile exists and missing phone, update it too
      if (prof && !prof.phone && phone) {
        const updatedProfData = { ...prof, phone, updatedAt: new Date().toISOString() };
        await pool.query(
          "UPDATE student_profiles SET data = $1, updated_at = NOW() WHERE student_id = $2",
          [JSON.stringify(updatedProfData), u.student_id]
        );
      }

      updatedCount++;
      if (updatedCount <= 10 || u.email?.includes('ashwath') || u.role !== 'STUDENT') {
        console.log(`✅ [${u.role}] ${u.email} (${u.student_id || u.id}) -> Contact: ${phone || 'N/A'} -> Password: ${targetPassword}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} users to password formula: sece@<last4_of_contact>!`);
  } catch (err) {
    console.error('❌ Error updating passwords:', err);
  } finally {
    process.exit(0);
  }
})();

