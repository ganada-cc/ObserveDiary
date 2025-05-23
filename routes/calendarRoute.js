const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

// calendar 조회 
router.get('', calendarController.getCalendar);

// calendar post
router.post('', calendarController.postCalendar);


module.exports = router;