// Run once to create the first super admin:
// node server/scripts/seedAdmin.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_marketplace');
  console.log('Connected to MongoDB');

  const existing = await Admin.findOne({ email: 'admin@campusmarket.com' });
  if (existing) {
    console.log('⚠️  Super admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await Admin.create({
    name: 'Super Admin',
    email: 'admin@campusmarket.com',
    password: 'Admin@1234',        // Change this immediately after first login!
    role: 'super_admin'
  });

  console.log('✅ Super admin created!');
  console.log('   Email   :', admin.email);
  console.log('   Password: Admin@1234');
  console.log('   ⚠️  Change the password after first login via the admin panel.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
