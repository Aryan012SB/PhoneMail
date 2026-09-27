const fs = require('fs');
const path = require('path');

const provider = process.argv[2] || 'postgresql';
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  if (provider === 'postgresql') {
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  } else if (provider === 'sqlite') {
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  }

  fs.writeFileSync(schemaPath, schema);
  console.log(`✅ Prisma schema provider updated to: ${provider}`);
} catch (err) {
  console.error('❌ Error updating Prisma schema provider:', err);
  process.exit(1);
}
