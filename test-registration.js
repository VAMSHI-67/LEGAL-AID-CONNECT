#!/usr/bin/env node

/**
 * Registration Test Script
 * This script tests the registration endpoint to ensure it works correctly
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint...\n');

  const testUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    phone: '+1234567890',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    dateOfBirth: '1990-01-01',
    role: 'client'
  };

  console.log('📤 Sending registration request with data:');
  console.log(JSON.stringify(testUserData, null, 2));

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUserData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n❌ Registration failed!');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend is running and healthy');
    return true;
  } catch (error) {
    console.log('❌ Backend is not accessible');
    console.log('Make sure your backend is running on port 5000');
    return false;
  }
}

async function runTest() {
  console.log('🔍 Checking backend health...');
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    console.log('\n❌ Cannot run test - backend is not accessible');
    return;
  }

  console.log('\n🚀 Starting registration test...');
  await testRegistration();
  
  console.log('\n📋 Test completed!');
  console.log('Check the backend console for detailed logs.');
}

runTest();
