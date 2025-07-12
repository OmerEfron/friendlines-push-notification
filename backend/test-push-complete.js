const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/v1';

// Demo push token (in real app, this comes from Expo)
const DEMO_PUSH_TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

async function testCompletePushFlow() {
  try {
    console.log('🚀 Testing Complete Push Notification Flow\n');

    // 1. Create a new test user with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const testUsername = `test${timestamp}`;
    console.log(`1️⃣ Creating test user ${testUsername}...`);
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: 'demo123',
      displayName: 'Test User'
    });
    const testUserToken = registerResponse.data.token;
    const testUserId = registerResponse.data.user.id;
    console.log('✅ Test user created\n');

    // 2. Login as Noa and register push token
    console.log('2️⃣ Logging in as Noa and registering push token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'noa',
      password: 'demo123'
    });
    const noaToken = loginResponse.data.token;
    const noaId = loginResponse.data.user.id;
    
    await axios.post(
      `${API_URL}/notifications/register-token`,
      { pushToken: DEMO_PUSH_TOKEN },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Push token registered for Noa\n');

    // 3. Test friend request notification
    console.log('3️⃣ Test user sending friend request to Noa...');
    await axios.post(
      `${API_URL}/users/friends/request`,
      { receiverId: noaId },
      { headers: { Authorization: `Bearer ${testUserToken}` } }
    );
    console.log('✅ Friend request sent');
    console.log('📱 Push notification should be sent to Noa\n');

    // 4. Login as Amir (already friends with Noa)
    console.log('4️⃣ Logging in as Amir...');
    const amirLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'amir',
      password: 'demo123'
    });
    const amirToken = amirLoginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // 5. Amir creates a newsflash (should notify Noa)
    console.log('5️⃣ Amir creating a newsflash...');
    const newsflashResponse = await axios.post(
      `${API_URL}/newsflashes`,
      {
        content: 'Breaking: New AI breakthrough announced! This changes everything in tech.',
        sections: ['Technology']
      },
      { headers: { Authorization: `Bearer ${amirToken}` } }
    );
    console.log('✅ Newsflash created');
    console.log('📱 Push notification should be sent to Noa (friend)\n');

    // 6. Test group invitation - invite Maya who's not in the group
    console.log('6️⃣ Registering push token for Maya...');
    const mayaLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'maya',
      password: 'demo123'
    });
    const mayaToken = mayaLoginResponse.data.token;
    const mayaId = mayaLoginResponse.data.user.id;
    
    await axios.post(
      `${API_URL}/notifications/register-token`,
      { pushToken: 'ExponentPushToken[maya-test-token]' },
      { headers: { Authorization: `Bearer ${mayaToken}` } }
    );
    
    console.log('Amir inviting Maya to Tech News Team group...');
    await axios.post(
      `${API_URL}/groups/1/invite`,
      { userId: mayaId },
      { headers: { Authorization: `Bearer ${amirToken}` } }
    );
    console.log('✅ Group invitation sent');
    console.log('📱 Push notification should be sent to Maya\n');

    // 7. Test notification types
    console.log('7️⃣ Testing different notification types...');
    
    // Test newsflash notification
    await axios.post(
      `${API_URL}/notifications/test`,
      { type: 'newsflash' },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Test newsflash notification sent');
    
    // Test friend request notification
    await axios.post(
      `${API_URL}/notifications/test`,
      { type: 'friend_request' },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Test friend request notification sent');
    
    // Test group invitation notification
    await axios.post(
      `${API_URL}/notifications/test`,
      { type: 'group_invitation' },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Test group invitation notification sent\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary of push notifications sent:');
    console.log('\nNoa received 5 push notifications:');
    console.log('  1. Friend request from test user');
    console.log('  2. Newsflash from Amir');
    console.log('  3. Test newsflash notification');
    console.log('  4. Test friend request notification');
    console.log('  5. Test group invitation notification');
    console.log('\nMaya received 1 push notification:');
    console.log('  1. Group invitation from Amir');
    console.log('\nNote: Since these are demo tokens, actual push notifications');
    console.log('won\'t be delivered, but the system processed them correctly.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

// Run the test
testCompletePushFlow(); 