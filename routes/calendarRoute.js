const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
// const authMiddleware = require('../middlewares/auth'); // 추가

router.get('/', calendarController.getCalendar);
router.post('/', calendarController.postCalendar);

router.get('/health/liveness', healthController.liveness);
router.get('/health/readiness', healthController.readiness);
// // calendar 조회 
// router.get('', calendarController.getCalendar);

// // calendar post
// router.post('', calendarController.postCalendar);

module.exports = router;