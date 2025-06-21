// tests/models/test-user-model.js
const User = require('../../backend/src/models/User');

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
    console.log(`${allUsers.length}人のユーザーが見つかりました`);
    
    // 5. ユーザー情報を更新
    console.log('\n5. ユーザー更新テスト:');
    const updatedUser = await User.update(newUser.id, {
      first_name: '更新済み',
      last_name: 'テスト'
    });
    console.log('更新されたユーザー:', updatedUser);
    
    // 6. ユーザーを削除
    console.log('\n6. ユーザー削除テスト:');
    const deleteResult = await User.delete(newUser.id);
    console.log('削除結果:', deleteResult);
    
    // 7. 削除後の検索テスト
    console.log('\n7. 削除後のユーザー検索テスト:');
    const deletedUser = await User.findById(newUser.id);
    console.log('検索結果:', deletedUser);
    
    console.log('\nすべてのテストが完了しました！');
    return {
      success: true,
      message: 'すべてのユーザーモデルテストが成功しました'
    };
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// スクリプト直接実行時にテストを実行
if (require.main === module) {
  testUserModel()
    .then(result => {
      if (!result.success) process.exit(1);
    })
    .catch(error => {
      console.error('予期せぬエラー:', error);
      process.exit(1);
    });
}

module.exports = { testUserModel };
