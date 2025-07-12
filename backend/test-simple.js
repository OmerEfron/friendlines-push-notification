const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/v1';

async function testSimple() {
  try {
    // 1. Test health endpoint
    console.log('Testing health endpoint...');
    const health = await axios.get('http://127.0.0.1:3000/health');
    console.log('✅ Health:', health.data);

    // 2. Test login
    console.log('\nTesting login...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      username: 'amir',
      password: 'demo123'
    });
    console.log('✅ Login successful');
    const token = login.data.token;

    // 3. Test creating newsflash without notifications
    console.log('\nTesting newsflash creation...');
    const newsflash = await axios.post(
      `${API_URL}/newsflashes`,
      {
        content: 'This is a test newsflash for debugging purposes!'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Newsflash created:', newsflash.data.newsflash);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

testSimple(); 