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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MBまでに引き上げ
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'), false);
    }
  }
});

// エラーハンドリング機能を追加したアップロードミドルウェア
exports.uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multerエラーの処理（サイズ制限など）
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '画像サイズが大きすぎます。10MB以下のファイルを選択してください。'
          });
        }
        return res.status(400).json({
          success: false,
          message: `アップロードエラー: ${err.message}`
        });
      } else {
        // その他のエラー処理
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
    }
    // エラーがなければ次のミドルウェアへ
    next();
  });
};