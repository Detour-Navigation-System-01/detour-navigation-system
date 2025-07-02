/**
 * @fileoverview ナビゲーションコントローラー
 * @description ナビゲーション関連のリクエストを処理するコントローラー
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

const BaseController = require('./BaseController');
const { catchAsync } = require('../middleware/errorHandler');
const routeService = require('../services/routeService');
const detourService = require('../services/detourService');