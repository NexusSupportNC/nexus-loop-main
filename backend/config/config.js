module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  dbPath: process.env.DB_PATH || './database/realestate.db',
  logPath: process.env.LOG_PATH || './logs/loop-log.xlsx'
};
