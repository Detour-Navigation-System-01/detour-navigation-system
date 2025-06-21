// tests/api/api-test.js
const http = require('http');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// バックエンドのベースURL
const baseUrl = 'http://localhost:3001/api';

/**
 * HTTPリクエストを実行する関数
 */
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * ユーザーAPIをテスト
 */
async function testUsersApi() {
  console.log('\n=== ユーザーAPIテスト ===');
  
  try {
    // ユーザー一覧取得
    console.log('\n> ユーザー一覧を取得します...');
    const usersResponse = await makeRequest('GET', `${baseUrl}/users`);
    console.log(`ステータスコード: ${usersResponse.statusCode}`);
    console.log('レスポンス:', JSON.stringify(usersResponse.data, null, 2));
    
    // ユーザー作成
    if (await askQuestion('ユーザー作成テストを実行しますか？ (y/n): ') === 'y') {
      console.log('\n> 新しいユーザーを作成します...');
      const newUser = {
        username: `testuser_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        first_name: 'テスト',
        last_name: 'ユーザー'
      };
      
      const createResponse = await makeRequest('POST', `${baseUrl}/users`, newUser);
      console.log(`ステータスコード: ${createResponse.statusCode}`);
      console.log('レスポンス:', JSON.stringify(createResponse.data, null, 2));
      
      // 作成したユーザーのID
      const userId = createResponse.data.data?.id;
      
      // ユーザー詳細取得
      if (userId) {
        console.log(`\n> ユーザーID: ${userId} の情報を取得します...`);
        const userResponse = await makeRequest('GET', `${baseUrl}/users/${userId}`);
        console.log(`ステータスコード: ${userResponse.statusCode}`);
        console.log('レスポンス:', JSON.stringify(userResponse.data, null, 2));
        
        // ユーザー更新
        if (await askQuestion('ユーザー更新テストを実行しますか？ (y/n): ') === 'y') {
          console.log(`\n> ユーザーID: ${userId} の情報を更新します...`);
          const updateData = {
            first_name: '更新済み',
            last_name: 'テストユーザー'
          };
          
          const updateResponse = await makeRequest('PUT', `${baseUrl}/users/${userId}`, updateData);
          console.log(`ステータスコード: ${updateResponse.statusCode}`);
          console.log('レスポンス:', JSON.stringify(updateResponse.data, null, 2));
        }
        
        // ユーザー削除
        if (await askQuestion('ユーザー削除テストを実行しますか？ (y/n): ') === 'y') {
          console.log(`\n> ユーザーID: ${userId} を削除します...`);
          const deleteResponse = await makeRequest('DELETE', `${baseUrl}/users/${userId}`);
          console.log(`ステータスコード: ${deleteResponse.statusCode}`);
          console.log('レスポンス:', JSON.stringify(deleteResponse.data, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

/**
 * 場所APIをテスト
 */
async function testPlacesApi() {
  console.log('\n=== 場所APIテスト ===');
  
  try {
    // 場所一覧取得
    console.log('\n> 場所一覧を取得します...');
    const placesResponse = await makeRequest('GET', `${baseUrl}/places`);
    console.log(`ステータスコード: ${placesResponse.statusCode}`);
    console.log('レスポンス:', JSON.stringify(placesResponse.data, null, 2));
    
    // 場所作成
    if (await askQuestion('場所作成テストを実行しますか？ (y/n): ') === 'y') {
      console.log('\n> 新しい場所を作成します...');
      const newPlace = {
        name: `テスト場所_${Date.now()}`,
        description: 'テスト用の場所データです',
        category: '観光',
        address: '東京都渋谷区',
        prefecture: '東京都',
        lat: 35.6580,
        lng: 139.7010,
        image_url: 'https://example.com/test.jpg'
      };
      
      const createResponse = await makeRequest('POST', `${baseUrl}/places`, newPlace);
      console.log(`ステータスコード: ${createResponse.statusCode}`);
      console.log('レスポンス:', JSON.stringify(createResponse.data, null, 2));
      
      // 作成した場所のID
      const placeId = createResponse.data.data?.id;
      
      if (placeId) {
        // 場所詳細取得
        console.log(`\n> 場所ID: ${placeId} の情報を取得します...`);
        const placeResponse = await makeRequest('GET', `${baseUrl}/places/${placeId}`);
        console.log(`ステータスコード: ${placeResponse.statusCode}`);
        console.log('レスポンス:', JSON.stringify(placeResponse.data, null, 2));
        
        // 場所更新
        if (await askQuestion('場所更新テストを実行しますか？ (y/n): ') === 'y') {
          console.log(`\n> 場所ID: ${placeId} の情報を更新します...`);
          const updateData = {
            description: '更新された説明文です',
            image_url: 'https://example.com/updated.jpg'
          };
          
          const updateResponse = await makeRequest('PUT', `${baseUrl}/places/${placeId}`, updateData);
          console.log(`ステータスコード: ${updateResponse.statusCode}`);
          console.log('レスポンス:', JSON.stringify(updateResponse.data, null, 2));
        }
        
        // 場所削除
        if (await askQuestion('場所削除テストを実行しますか？ (y/n): ') === 'y') {
          console.log(`\n> 場所ID: ${placeId} を削除します...`);
          const deleteResponse = await makeRequest('DELETE', `${baseUrl}/places/${placeId}`);
          console.log(`ステータスコード: ${deleteResponse.statusCode}`);
          console.log('レスポンス:', JSON.stringify(deleteResponse.data, null, 2));
        }
      }
    }
    
    // 近隣の場所を検索
    if (await askQuestion('近隣の場所検索テストを実行しますか？ (y/n): ') === 'y') {
      console.log('\n> 東京スカイツリー周辺の場所を検索します...');
      const nearbyResponse = await makeRequest('GET', `${baseUrl}/places/nearby?lat=35.7100&lng=139.8107&radius=5`);
      console.log(`ステータスコード: ${nearbyResponse.statusCode}`);
      console.log('レスポンス:', JSON.stringify(nearbyResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

/**
 * 認証APIをテスト
 */
async function testAuthApi() {
  console.log('\n=== 認証APIテスト ===');
  
  try {
    // ユーザー登録
    if (await askQuestion('ユーザー登録テストを実行しますか？ (y/n): ') === 'y') {
      console.log('\n> 新しいユーザーを登録します...');
      const newUser = {
        username: `authuser_${Date.now()}`,
        email: `auth${Date.now()}@example.com`,
        password: 'password123',
        first_name: '認証',
        last_name: 'テスト'
      };
      
      const registerResponse = await makeRequest('POST', `${baseUrl}/auth/register`, newUser);
      console.log(`ステータスコード: ${registerResponse.statusCode}`);
      console.log('レスポンス:', JSON.stringify(registerResponse.data, null, 2));
      
      // ログイン
      console.log('\n> 登録したユーザーでログインします...');
      const loginData = {
        username: newUser.username,
        password: newUser.password
      };
      
      const loginResponse = await makeRequest('POST', `${baseUrl}/auth/login`, loginData);
      console.log(`ステータスコード: ${loginResponse.statusCode}`);
      console.log('レスポンス:', JSON.stringify(loginResponse.data, null, 2));
      
      // パスワード変更
      if (loginResponse.data.data?.user?.id && await askQuestion('パスワード変更テストを実行しますか？ (y/n): ') === 'y') {
        const userId = loginResponse.data.data.user.id;
        console.log(`\n> ユーザーID: ${userId} のパスワードを変更します...`);
        
        const passwordData = {
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        };
        
        const changePasswordResponse = await makeRequest('POST', `${baseUrl}/auth/change-password/${userId}`, passwordData);
        console.log(`ステータスコード: ${changePasswordResponse.statusCode}`);
        console.log('レスポンス:', JSON.stringify(changePasswordResponse.data, null, 2));
        
        // 新しいパスワードでログイン
        console.log('\n> 新しいパスワードでログインします...');
        const newLoginData = {
          username: newUser.username,
          password: 'newpassword456'
        };
        
        const newLoginResponse = await makeRequest('POST', `${baseUrl}/auth/login`, newLoginData);
        console.log(`ステータスコード: ${newLoginResponse.statusCode}`);
        console.log('レスポンス:', JSON.stringify(newLoginResponse.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  }
}

/**
 * ユーザー入力を取得
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== APIテストツール ===');
  console.log('テストしたいAPIを選択してください:');
  console.log('1. ユーザーAPI');
  console.log('2. 場所API');
  console.log('3. 認証API');
  console.log('4. すべて');
  console.log('0. 終了');
  
  try {
    while (true) {
      const choice = await askQuestion('\n選択 (0-4): ');
      
      switch (choice) {
        case '1':
          await testUsersApi();
          break;
        case '2':
          await testPlacesApi();
          break;
        case '3':
          await testAuthApi();
          break;
        case '4':
          await testUsersApi();
          await testPlacesApi();
          await testAuthApi();
          break;
        case '0':
          console.log('\nテストを終了します。');
          rl.close();
          return;
        default:
          console.log('無効な選択です。もう一度お試しください。');
      }
      
      console.log('\n他のテストを実行しますか？');
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    rl.close();
  }
}

// プログラム実行
if (require.main === module) {
  main();
}

module.exports = {
  makeRequest,
  testUsersApi,
  testPlacesApi,
  testAuthApi
};
