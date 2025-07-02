/**
 * @fileoverview 画像アップロードミドルウェア
 * @description 画像ファイルのアップロード処理を担当するミドルウェア
 * @author 瀬下美華
 * @created 2025-06-25
 * @updated 2025-07-03
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path'); // pathモジュールをインポート
const fs = require('fs'); // fsモジュールをインポート

// 画像保存先のディレクトリを定義
// 例: プロジェクトルートの public/images フォルダ
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'images');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 保存先ディレクトリ
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // ファイル名をユニークにする (タイムスタンプ + 元のファイル名)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // 拡張子を取得
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MBまで
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

exports.uploadImage = upload.single('image');