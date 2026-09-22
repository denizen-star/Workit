const { connect } = require('@planetscale/database');
require('dotenv').config({ path: '.env.local' });

const config = {
  url: process.env.DATABASE_URL
};

async function main() {
  const conn = connect(config);
  try {
    await conn.execute("ALTER TABLE users ADD COLUMN gender VARCHAR(16) NOT NULL DEFAULT 'male'");
    console.log("Column 'gender' added successfully.");
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
      console.log("Column 'gender' already exists.");
    } else {
      console.error("Error adding column:", e);
    }
  }
}

main();