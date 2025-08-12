#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 LegalAid Connect Setup Script');
console.log('================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Create necessary directories
const directories = [
  'backend/uploads',
  'backend/logs',
  'public/images',
  'components',
  'utils',
  'hooks'
];

console.log('\n📁 Creating directories...');
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`⏭️  Skipped: ${dir} (already exists)`);
  }
});

// Copy environment file
const envExamplePath = path.join(process.cwd(), 'env.example');
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env.local from template');
  console.log('⚠️  Please update .env.local with your configuration values');
} else if (fs.existsSync(envPath)) {
  console.log('⏭️  Skipped: .env.local (already exists)');
} else {
  console.log('❌ env.example not found');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Create basic .gitignore if it doesn't exist
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
.next/
out/
build/
dist/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Created .gitignore');
}

// Create .gitkeep files for empty directories
const gitkeepDirs = ['backend/uploads', 'public/images'];
gitkeepDirs.forEach(dir => {
  const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update .env.local with your configuration values');
console.log('2. Set up your MongoDB database');
console.log('3. Configure Cloudinary for file uploads (optional)');
console.log('4. Run "npm run dev:full" to start development servers');
console.log('\n📚 Documentation:');
console.log('- README.md - Project overview and setup instructions');
console.log('- API documentation in backend/routes/');
console.log('\n🔗 Quick start:');
console.log('npm run dev:full'); 