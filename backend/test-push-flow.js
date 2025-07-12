const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/v1';

// Demo push token (in real app, this comes from Expo)
const DEMO_PUSH_TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

async function testPushNotificationFlow() {
  try {
    console.log('🚀 Testing Push Notification Flow\n');

    // 1. Login as Noa
    console.log('1️⃣ Logging in as Noa...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'noa',
      password: 'demo123'
    });
    const noaToken = loginResponse.data.token;
    const noaId = loginResponse.data.user.id;
    console.log('✅ Logged in successfully\n');

    // 2. Register push token for Noa
    console.log('2️⃣ Registering push token for Noa...');
    await axios.post(
      `${API_URL}/notifications/register-token`,
      { pushToken: DEMO_PUSH_TOKEN },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Push token registered\n');

    // 3. Login as Amir
    console.log('3️⃣ Logging in as Amir...');
    const amirLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'amir',
      password: 'demo123'
    });
    const amirToken = amirLoginResponse.data.token;
    const amirId = amirLoginResponse.data.user.id;
    console.log('✅ Logged in successfully\n');

    // 4. Amir creates a newsflash (should notify Noa since they're friends)
    console.log('4️⃣ Amir creating a newsflash...');
    const newsflashResponse = await axios.post(
      `${API_URL}/newsflashes`,
      {
        content: 'Just launched our new app! 🚀 Amazing features ahead!',
        sections: ['Technology']
      },
      { headers: { Authorization: `Bearer ${amirToken}` } }
    );
    console.log('✅ Newsflash created');
    console.log('📱 Push notification should be sent to Noa\n');

    // 5. Login as Maya
    console.log('5️⃣ Logging in as Maya...');
    const mayaLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'maya',
      password: 'demo123'
    });
    const mayaToken = mayaLoginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // 6. Maya sends friend request to Noa
    console.log('6️⃣ Maya sending friend request to Noa...');
    await axios.post(
      `${API_URL}/users/friends/request`,
      { receiverId: noaId },
      { headers: { Authorization: `Bearer ${mayaToken}` } }
    );
    console.log('✅ Friend request sent');
    console.log('📱 Push notification should be sent to Noa\n');

    // 7. Amir invites Noa to Tech News Team group
    console.log('7️⃣ Amir inviting Noa to Tech News Team group...');
    await axios.post(
      `${API_URL}/groups/1/invite`,
      { userId: noaId },
      { headers: { Authorization: `Bearer ${amirToken}` } }
    );
    console.log('✅ Group invitation sent');
    console.log('📱 Push notification should be sent to Noa\n');

    // 8. Test direct notification
    console.log('8️⃣ Sending test notification to Noa...');
    await axios.post(
      `${API_URL}/notifications/test`,
      { type: 'newsflash' },
      { headers: { Authorization: `Bearer ${noaToken}` } }
    );
    console.log('✅ Test notification sent\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\nNote: In a real app, Noa would receive 4 push notifications:');
    console.log('  1. New newsflash from Amir');
    console.log('  2. Friend request from Maya');
    console.log('  3. Group invitation from Amir');
    console.log('  4. Test notification');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testPushNotificationFlow(); 