const {pool} = require('../db');

const scheduleWindow = async () => {
  try {
    await pool.query
    (
      `UPDATE found_items 
       SET is_public = TRUE 
       WHERE is_public = FALSE 
       AND match_window_end <= NOW()`
    );
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run every hour (3600000 ms)
setInterval(scheduleWindow, 60 * 60 * 1000);

// Run on startup
scheduleWindow();

module.exports = { scheduleWindow };