const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let provider = process.argv[2];

if (!provider) {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    provider = 'postgresql';
  } else {
    provider = 'sqlite';
  }
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  if (provider === 'postgresql') {
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  } else if (provider === 'sqlite') {
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  }

  fs.writeFileSync(schemaPath, schema);
  console.log(`✅ Prisma schema provider set to: ${provider}`);
} catch (err) {
  console.error('❌ Error updating Prisma schema provider:', err);
  process.exit(1);
}
