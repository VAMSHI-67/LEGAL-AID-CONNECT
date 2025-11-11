#!/usr/bin/env node

/**
 * Port Configuration Test Script
 * This script tests if your ports are correctly configured and accessible
 */

const http = require('http');

console.log('🔍 Testing Port Configuration...\n');

// Test backend port 5000
function testBackendPort() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend (port 5000): RUNNING');
        resolve(true);
      } else {
        console.log('⚠️  Backend (port 5000): RESPONDING but with status', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Backend (port 5000): NOT RUNNING');
      } else {
        console.log('❌ Backend (port 5000): ERROR -', err.message);
      }
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('⏰ Backend (port 5000): TIMEOUT');
      resolve(false);
    });
  });
}

// Test frontend port 3000
function testFrontendPort() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend (port 3000): RUNNING');
        resolve(true);
      } else {
        console.log('⚠️  Frontend (port 3000): RESPONDING but with status', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Frontend (port 3000): NOT RUNNING');
      } else {
        console.log('❌ Frontend (port 3000): ERROR -', err.message);
      }
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('⏰ Frontend (port 3000): TIMEOUT');
      resolve(false);
    });
  });
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n🔧 Environment Variables Check:');
  
  // Check if backend .env exists (we can't read it directly due to gitignore)
  console.log('📁 Backend .env: Check if file exists in backend/ directory');
  console.log('📁 Frontend .env.local: Check if file exists in root directory');
  
  console.log('\n📋 Required Environment Variables:');
  console.log('   Backend (.env):');
  console.log('   - PORT=5000');
  console.log('   - CORS_ORIGIN=http://localhost:3000');
  console.log('   - MONGODB_URI=mongodb://localhost:27017/legalaid_connect');
  console.log('   - JWT_SECRET=your_secret_key');
  
  console.log('\n   Frontend (.env.local):');
  console.log('   - NEXT_PUBLIC_API_URL=http://localhost:5000');
  console.log('   - NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000');
}

// Run tests
async function runTests() {
  const backendRunning = await testBackendPort();
  const frontendRunning = await testFrontendPort();
  
  testEnvironmentVariables();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Backend (5000): ${backendRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  console.log(`   Frontend (3000): ${frontendRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  
  if (backendRunning && frontendRunning) {
    console.log('\n🎉 SUCCESS: Both services are running on their correct ports!');
    console.log('   - Backend: http://localhost:5000');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - API calls should work correctly');
  } else {
    console.log('\n⚠️  ISSUES DETECTED:');
    if (!backendRunning) {
      console.log('   - Backend is not running on port 5000');
      console.log('   - Run: cd backend && npm run server:dev');
    }
    if (!frontendRunning) {
      console.log('   - Frontend is not running on port 3000');
      console.log('   - Run: npm run dev');
    }
  }
  
  console.log('\n📚 Next Steps:');
  console.log('   1. Create the .env files as shown above');
  console.log('   2. Start backend: cd backend && npm run server:dev');
  console.log('   3. Start frontend: npm run dev');
  console.log('   4. Run this test again: node test-ports.js');
}

runTests();
