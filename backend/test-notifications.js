const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/v1';

async function testNotifications() {
  try {
    console.log('🧪 Testing Push Notification Integration\n');

    // 1. Login as demo user
    console.log('1️⃣ Logging in as noa...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'noa', password: 'demo123' })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const { token, user } = await loginResponse.json();
    console.log('✅ Logged in successfully:', user.username);

    // 2. Register push token (simulated)
    console.log('\n2️⃣ Registering push token...');
    const pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    
    const tokenResponse = await fetch(`${API_URL}/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pushToken,
        platform: 'ios',
        deviceId: 'test-device-001'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token registration failed: ${error}`);
    }

    console.log('✅ Push token registered successfully');

    // 3. Test sending notifications
    console.log('\n3️⃣ Testing notification types...');

    // Test newsflash notification
    console.log('\n📰 Testing newsflash notification...');
    const newsflashTest = await fetch(`${API_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'newsflash' })
    });

    if (newsflashTest.ok) {
      console.log('✅ Newsflash notification test sent');
    } else {
      console.log('❌ Newsflash notification test failed');
    }

    // Test friend request notification
    console.log('\n👥 Testing friend request notification...');
    const friendTest = await fetch(`${API_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'friend_request' })
    });

    if (friendTest.ok) {
      console.log('✅ Friend request notification test sent');
    } else {
      console.log('❌ Friend request notification test failed');
    }

    // Test group invitation notification
    console.log('\n👥 Testing group invitation notification...');
    const groupTest = await fetch(`${API_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'group_invitation' })
    });

    if (groupTest.ok) {
      console.log('✅ Group invitation notification test sent');
    } else {
      console.log('❌ Group invitation notification test failed');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\nNote: Since this is a test with a simulated token, actual push notifications won\'t be delivered.');
    console.log('In a real app with valid Expo push tokens, notifications would appear on the device.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testNotifications(); 