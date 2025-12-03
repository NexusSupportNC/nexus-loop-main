const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const initializeAdminPassword = async () => {
  try {
    const adminUser = userModel.findByEmail('admin@nexusrealtync.co');
    if (!adminUser) {
      console.log('Admin user not found. Creating admin user...');
      return;
    }

    const newPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    userModel.updatePassword(adminUser.id, hashedPassword);
    
    console.log('✅ Admin password updated to: admin123');
    console.log('   Email: admin@nexusrealtync.co');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('Error initializing admin password:', error);
  }
};

module.exports = { initializeAdminPassword };
