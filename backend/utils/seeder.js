const bcrypt = require('bcryptjs');

/**
 * Seeds default admin and staff credentials if they don't exist in the database.
 */
async function seedDefaultUsers(pool) {
  try {
    // 0. Database migrations
    await pool.query(`
      ALTER TABLE public.outlets 
      ADD COLUMN IF NOT EXISTS image_url character varying(500);
    `);

    // 1. Seed admin credentials: admin@guptasandwich.com / admin123
    const adminEmail = 'admin@guptasandwich.com';
    const adminCheck = await pool.query('SELECT id FROM admin WHERE email = $1', [adminEmail]);
    
    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO admin (name, email, username, password_hash, role, is_super_admin, permissions, status)
         VALUES ($1, $2, $3, $4, 'ADMIN', false, '{"all": true}'::jsonb, 'active')`,
        ['Default Admin', adminEmail, 'admin', adminHash]
      );
      console.log('🌱 Seeded default admin account (admin@guptasandwich.com)');
    }

    // 2. Seed staff credentials: staff@guptasandwich.com / staff123
    const staffEmail = 'staff@guptasandwich.com';
    const staffCheck = await pool.query('SELECT id FROM users WHERE email = $1', [staffEmail]);

    if (staffCheck.rows.length === 0) {
      // Find first available outlet
      const outletRes = await pool.query('SELECT id FROM outlets LIMIT 1');
      if (outletRes.rows.length === 0) {
        console.warn('⚠️ No outlets found in the database. Creating a mock outlet for the staff user.');
        const mockOutlet = await pool.query(
          `INSERT INTO outlets (name, address, phone, manager, username, password_hash, status)
           VALUES ('Koregaon Park', 'Lane 5, Pune', '9876543210', 'Manager', 'kp_outlet', $1, 'active')
           RETURNING id`,
          [await bcrypt.hash('kp@1234', 10)]
        );
        outletRes.rows.push(mockOutlet.rows[0]);
      }
      
      const outletId = outletRes.rows[0].id;
      const staffHash = await bcrypt.hash('staff123', 10);
      await pool.query(
        `INSERT INTO users (outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status)
         VALUES ($1, $2, $3, $4, $5, 'Cashier', 'Staff', '{"admin": [], "staff": ["pos", "live-orders"]}'::jsonb, 'active')`,
        [outletId, 'Default Staff', staffEmail, 'staff', staffHash]
      );
      console.log(`🌱 Seeded default staff account (staff@guptasandwich.com) bound to outlet ID: ${outletId}`);
    }
  } catch (err) {
    console.error('❌ Failed to seed default accounts:', err);
  }
}

module.exports = { seedDefaultUsers };
