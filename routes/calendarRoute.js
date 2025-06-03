const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middlewares/auth'); // 추가

// calendar 조회 (인증 필요)
router.get('/', authMiddleware, calendarController.getCalendar);

// calendar 등록 (인증 필요)
router.post('/', authMiddleware, calendarController.postCalendar);

// // calendar 조회 
// router.get('', calendarController.getCalendar);

// // calendar post
// router.post('', calendarController.postCalendar);

module.exports = router;