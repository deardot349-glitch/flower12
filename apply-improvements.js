const { execSync } = require('child_process');

console.log('🚀 Applying SaaS improvements...\n');

function run(command, description) {
  console.log(`${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    process.exit(1);
  }
}

run('npm install', '📦 Installing dependencies');
run('npx prisma generate', '🔨 Generating Prisma client');
run('npx prisma db push', '🗄️  Pushing database schema');
run('npx tsx prisma/seed.ts', '🌱 Seeding database');

console.log('\n✅ Setup complete!');
console.log('\n📝 What\'s New:');
console.log('   ✓ Enhanced database with delivery zones');
console.log('   ✓ Shop settings system');
console.log('   ✓ Delivery zones management');
console.log('   ✓ Improved order system');
console.log('\n🌐 Next: npm run dev');
console.log('📊 Visit: http://localhost:3000/dashboard/settings/delivery');
