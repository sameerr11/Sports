const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Test login API
const testLoginApi = async (email, password) => {
  try {
    console.log(`Testing login API for ${email}...`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    
    // Store token for further tests
    const token = response.data.token;
    
    // Test get current user API
    await testGetCurrentUser(token);
    
    return token;
  } catch (err) {
    console.error('Login failed:', err.response?.data?.msg || err.message);
    return null;
  }
};

// Test get current user API
const testGetCurrentUser = async (token) => {
  try {
    console.log('\nTesting get current user API...');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Current user:', response.data);
  } catch (err) {
    console.error('Get current user failed:', err.response?.data?.msg || err.message);
  }
};

// Test get users API (admin only)
const testGetUsers = async (token) => {
  try {
    console.log('\nTesting get users API...');
    
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log(`Retrieved ${response.data.length} users`);
  } catch (err) {
    console.error('Get users failed:', err.response?.data?.msg || err.message);
  }
};

// Main function
const main = async () => {
  // Get email and password from command line arguments
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  
  // Test login
  const token = await testLoginApi(email, password);
  
  if (token) {
    // Test get users (admin only)
    await testGetUsers(token);
  }
  
  process.exit(0);
};

// Run the main function
main(); 