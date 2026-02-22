const { execSync } = require('child_process');

function run(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    process.exit(1);
  }
}

console.log('🌸 Setting up Flower Shop SaaS...\n');

// Install dependencies
run('npm install', '📦 Installing dependencies');

// Generate Prisma client
run('npx prisma generate', '🔨 Generating Prisma client');

// Reset and seed database
run('npx prisma db push --force-reset', '🗄️  Resetting database');
run('npx tsx prisma/seed.ts', '🌱 Seeding database');

console.log('\n✅ Setup complete!');
console.log('\n📝 Demo Credentials:');
console.log('   Email: demo@flowershop.com');
console.log('   Password: demo123');
console.log('\n🌐 Your demo shop: http://localhost:3000/rose-garden');
console.log('🔐 Admin panel: http://localhost:3000/dashboard');
console.log('\n▶️  Start the dev server with: npm run dev');
