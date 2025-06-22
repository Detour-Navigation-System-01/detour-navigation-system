// backend/src/utils/test-place-model.js
//実行方法：node src/utils/test-place-model.js
const Place = require('../models/Place');

async function testPlaceModel() {
  try {
    console.log('スポットモデルのテストを開始します...');

    const testUserId = 1; // すでに存在しているユーザーのIDを使用（事前に確認してください）

    // 1. スポットの作成
    console.log('\n1. スポット作成テスト:');
    const newPlace = await Place.create({
      user_id: testUserId,
      latitude: 35.6895,
      longitude: 139.6917,
      photo_url: 'https://example.com/photo.jpg'
    });
    console.log('作成されたスポット:', newPlace);

    // 2. IDでスポットを検索
    console.log('\n2. スポット検索テスト (ID):');
    const foundPlace = await Place.findById(newPlace.id);
    console.log('検索結果:', foundPlace);

    // 3. ユーザーIDでスポット一覧を取得
    console.log('\n3. ユーザーのスポット一覧取得テスト:');
    const userPlaces = await Place.findAllByUser(testUserId);
    console.log(`${userPlaces.length}件のスポットが見つかりました`);
    userPlaces.forEach(place =>
      console.log(`- ${place.id}: (${place.latitude}, ${place.longitude})`)
    );

    // 4. スポット情報の更新
    console.log('\n4. スポット更新テスト:');
    const updatedPlace = await Place.update(newPlace.id, {
      photo_url: 'https://example.com/updated-photo.jpg'
    });
    console.log('更新後のスポット:', updatedPlace);

    // 5. スポットの削除（任意でコメントアウト）
    /*
    console.log('\n5. スポット削除テスト:');
    const isDeleted = await Place.delete(newPlace.id);
    console.log('削除結果:', isDeleted ? '成功' : '失敗');

    // 削除確認
    const checkDeleted = await Place.findById(newPlace.id);
    console.log('削除されたスポット検索結果:', checkDeleted);
    */

    console.log('\n✅ スポットモデルのテスト完了');

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
  }
}

testPlaceModel();
