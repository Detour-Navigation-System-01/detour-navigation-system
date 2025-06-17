// backend/src/utils/test-user-model.js
const User = require('../models/User');

async function testUserModel() {
  try {
    console.log('ユーザーモデルのテストを開始します...');
    
    // 1. ユーザーの作成
    console.log('\n1. ユーザーの作成テスト:');
    const newUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123', // 実際のアプリでは必ずハッシュ化する
      first_name: 'テスト',
      last_name: 'ユーザー'
    });
    console.log('作成されたユーザー:', newUser);
    
    // 2. IDでユーザーを検索
    console.log('\n2. ユーザー検索テスト (ID):');
    const foundUser = await User.findById(newUser.id);
    console.log('検索結果:', foundUser);
    
    // 3. ユーザー名でユーザーを検索
    console.log('\n3. ユーザー検索テスト (ユーザー名):');
    const foundByUsername = await User.findByUsernameOrEmail('testuser');
    console.log('検索結果:', foundByUsername);
    
    // 4. すべてのユーザーを取得
    console.log('\n4. 全ユーザー取得テスト:');
    const allUsers = await User.findAll();
    console.log(`${allUsers.length}件のユーザーが見つかりました`);
    allUsers.forEach(user => console.log(`- ${user.id}: ${user.username} (${user.email})`));
    
    // 5. ユーザー情報の更新
    console.log('\n5. ユーザー更新テスト:');
    const updatedUser = await User.update(newUser.id, {
      first_name: '更新済み',
      last_name: 'テストユーザー'
    });
    console.log('更新後のユーザー:', updatedUser);
    
    // 6. ユーザーの削除 (コメントアウトして実行しないようにしておく)
    /*
    console.log('\n6. ユーザー削除テスト:');
    const isDeleted = await User.delete(newUser.id);
    console.log('削除結果:', isDeleted ? '成功' : '失敗');
    
    // 削除確認
    const checkDeleted = await User.findById(newUser.id);
    console.log('削除されたユーザー検索結果:', checkDeleted);
    */
    
    console.log('\n✅ ユーザーモデルのテスト完了');
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
  }
}

testUserModel();