const calendarService = require('../services/calendarService');
const path = require('path');
const calendarDate = require('../public/js/calendar.js');
// const jwt = require('jsonwebtoken');
// const secret = require('../config/secret');
const querystring = require('querystring');
const baseResponse = require("../config/baseResponseStatus");

// 캘린더 조회
exports.getCalendar = async function (req, res) {
  const user_id = req.headers['x-user-id'];

  if (!user_id) {
    console.log('x-user-id 헤더 없음음');
    return res.send(baseResponse.USER_USERIDX_EMPTY);
  }
  if (parseInt(user_id) <= 0) return res.send(baseResponse.USER_USERIDX_LENGTH);

  let { selectedYear, selectedMonth, selectedDate } = req.query;

  // 하나라도 누락되면 리디렉션
  if (!selectedYear || !selectedMonth || !selectedDate) {
    const today = new Date();
    selectedYear = String(today.getFullYear()).padStart(4, '0');
    selectedMonth = String(today.getMonth() + 1).padStart(2, '0');
    selectedDate = String(today.getDate()).padStart(2, '0');

    const redirectURL = `${req.baseUrl}?selectedYear=${selectedYear}&selectedMonth=${selectedMonth}&selectedDate=${selectedDate}`;
    console.log("🔁 Redirecting to:", redirectURL);
    return res.redirect(redirectURL);
  }

  const date = selectedYear + selectedMonth + selectedDate;

  try {
    const calendarResult = await calendarService.retrieveCalendar(user_id, date);
    const calendarDataResult = await calendarService.retrieveSelectedCalendar(user_id, date);

    if (calendarResult.length > 0) {
      console.log("캘린더 조회: 데이터 있음");
      return res.render('calendar/calendar.ejs', { calendarResult, calendarDataResult });
    } else {
      console.log("캘린더 조회: 데이터 없음");
      return res.render('calendar/calendar.ejs', { calendarResult: null, calendarDataResult });
    }
  } catch (err) {
    console.error("getCalendar 에러:", err);
    return res.status(500).send("서버 에러 발생");
  }
};

exports.postCalendar = async function (req, res) {
  const user_id = req.headers['x-user-id'];

  if (!user_id) return res.send(baseResponse.USER_USERIDX_EMPTY);
  if (parseInt(user_id) <= 0) return res.send(baseResponse.USER_USERIDX_LENGTH);

    console.log("받은 캘린더 데이터:", req.body);
    const date = req.query.selectedYear + req.query.selectedMonth + req.query.selectedDate;
    console.log("등록 날짜:", date);

    if (!user_id) return res.send(baseResponse.USER_USERIDX_EMPTY);
    if (user_id <= 0) return res.send(baseResponse.USER_USERIDX_LENGTH);

    const {
      hospital_name,
      hospital_schedule,
      check_content,
      sleep_time,
      symptom_range,
      diary_text,
      is_check
    } = req.body;

    try {
      const createCalResponse = await calendarService.createCalendar(
        user_id,
        date,
        check_content,
        sleep_time,
        symptom_range,
        diary_text,
        is_check
      );

      console.log("캘린더 저장 결과:", createCalResponse);
      const queryString = querystring.stringify(req.query);

      if (createCalResponse === "성공") {
        return res.status(200).send(`
          <script>
            if (confirm('캘린더 등록에 성공했습니다.')) {
              window.location.href = "/calendar?${queryString}";
            }
          </script>
        `);
      } else {
        return res.send(`
          <script>
            if (confirm('캘린더 등록에 실패했습니다. (${createCalResponse})')) {
              window.location.href = "/calendar?${queryString}";
            }
          </script>
        `);
      }
    } catch (err) {
      console.error("postCalendar 에러:", err);
      const queryString = querystring.stringify(req.query);
      return res.send(`
        <script>
          if (confirm('캘린더 등록 중 예외가 발생했습니다.')) {
            window.location.href = "/calendar?${queryString}";
          }
        </script>
      `);
    }
  
};