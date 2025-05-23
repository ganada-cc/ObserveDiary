const calendarService = require('../services/calendarService');
const path = require('path');
const calendarDate = require('../public/js/calendar.js');
const jwt = require('jsonwebtoken');
const secret = require('../config/secret');
const querystring = require('querystring');
const baseResponse = require("../config/baseResponseStatus");

// 캘린더 조회
exports.getCalendar = async function (req, res) {
  const token = req.cookies.x_auth;
  if (token) {
    const decodedToken = jwt.verify(token, secret.jwtsecret);
    const user_id = decodedToken.user_id;

    let date = req.query.selectedYear + req.query.selectedMonth + req.query.selectedDate;
    if (!req.query.selectedYear || !req.query.selectedMonth || !req.query.selectedDate) {
      const today = new Date();
      const selectedYear = String(today.getFullYear()).padStart(4, '0');
      const selectedMonth = String(today.getMonth() + 1).padStart(2, '0');
      const selectedDate = String(today.getDate()).padStart(2, '0');

      const existingQueryString = req.query;

      if (Object.keys(existingQueryString).length === 0) {
        const newURL = `${req.protocol}://${req.get('host')}${req.baseUrl}?selectedYear=${selectedYear}&selectedMonth=${selectedMonth}&selectedDate=${selectedDate}`;
        return res.redirect(newURL);
      }
    }

    if (!user_id) return res.send(baseResponse.USER_USERIDX_EMPTY);
    if (user_id <= 0) return res.send(baseResponse.USER_USERIDX_LENGTH);

    try {
      const calendarResult = await calendarService.retrieveCalendar(user_id, date);
      const calendarDataResult = await calendarService.retrieveSelectedCalendar(user_id, date);
      const MindDiaryResult = await calendarService.retrieveCalendar(user_id, date);
      const MindDiaryDataResult = await calendarService.retrieveSelectedMindDiary(user_id, date);

      console.log("🧠 MindDiaryDataResult:", MindDiaryDataResult);

      if (calendarResult.length > 0) {
        console.log("✅ 캘린더 조회: 데이터 있음");
        return res.render('calendar/calendar.ejs', { calendarResult, calendarDataResult, MindDiaryResult, MindDiaryDataResult });
      } else {
        console.log("⚠️ 캘린더 조회: 데이터 없음");
        return res.render('calendar/calendar.ejs', { calendarResult: null, calendarDataResult, MindDiaryResult, MindDiaryDataResult });
      }
    } catch (err) {
      console.error("❌ getCalendar 에러:", err);
      return res.status(500).send("서버 에러 발생");
    }
  } else {
    return res.redirect('/');
  }
};

exports.postCalendar = async function (req, res) {
  const token = req.cookies.x_auth;
  if (token) {
    const decodedToken = jwt.verify(token, secret.jwtsecret);
    const user_id = decodedToken.user_id;
    console.log("📥 받은 캘린더 데이터:", req.body);
    const date = req.query.selectedYear + req.query.selectedMonth + req.query.selectedDate;
    console.log("📅 등록 날짜:", date);

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

      console.log("📝 캘린더 저장 결과:", createCalResponse);
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
      console.error("❌ postCalendar 에러:", err);
      const queryString = querystring.stringify(req.query);
      return res.send(`
        <script>
          if (confirm('캘린더 등록 중 예외가 발생했습니다.')) {
            window.location.href = "/calendar?${queryString}";
          }
        </script>
      `);
    }
  } else {
    return res.redirect('/');
  }
};

exports.postFile = async function (req, res) {  
  const token = req.cookies.x_auth; 
  if (token) {
    const decodedToken = jwt.verify(token, secret.jwtsecret); // 토큰 검증, 복호화
    const user_id = decodedToken.user_id; // user_id를 추출
    
    const date = req.body.fileDate;
    console.log("date: "+req.body.fileDate);

  
    const server_name = path.basename(req.file.filename, path.extname(req.file.originalname)); //서버증상
      const user_name = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const extension = path.extname(req.file.filename);
      console.log(server_name + user_name + extension);

    var attachFileResponse;

    //const queryString = querystring.stringify(req.query);
    const selectedYear = String(date).slice(0, 4); // 처음 4글자는 년도
    const selectedMonth =  String(date).slice(4, 6); // 다음 2글자는 월
    const selectedDate =  String(date).slice(6, 9); // 다음 2글자는 일
    const newURL = `${req.protocol}://${req.get('host')}${req.baseUrl}?selectedYear=${selectedYear}&selectedMonth=${selectedMonth}&selectedDate=${selectedDate}`;     
      
    // 사진 확장자인 경우에만 처리
    if (['.png', '.jpg', '.jpeg', '.tiff', '.tif','.gif', '.webp', '.heif', '.heic'].includes(extension.toLowerCase())) {
      attachFileResponse = await calendarService.createFileMem(
        user_id,
        date,
        server_name,
        user_name,
        extension
      );
    }
    else{
      return res.send(`
        <script>
          if (confirm('png, jpg, jpeg, tif, tiff, gif, webp, heif, heic의 사진 확장자인 파일만 업로드할 수 있습니다. 확인을 누르면 메인 페이지로 돌아갑니다.')) {
            window.location.href = "/calendar"; 
          }
        </script>
      `); 
    }



    if (!req.file) {
      return res.send(`
        <script>
          if (confirm('파일이 없습니다. 확인을 누르면 메인 페이지로 돌아갑니다.')) {
            window.location.href = "/calendar";
          }
        </script>
      `); 
    }
    // Code for handling file upload and database query goes here
    if (attachFileResponse == "성공") {
      return res.redirect(newURL);
    }
    else res.send(attachFileResponse);
    //return res.redirect('/calendar');
    //res.send(attachFileResponse);
  
  }
  else {
    return res.redirect('/');
  }
};

exports.postMindDiary = async function (req, res) {
  const token = req.cookies.x_auth;
  if (token) {
      const decodedToken = jwt.verify(token, secret.jwtsecret); // 토큰 검증, 복호화
      const user_id = decodedToken.user_id; // user_id를 추출
      const date = req.query.selectedYear + req.query.selectedMonth + req.query.selectedDate; //쿼리스트링에서 날짜 추출
      //const date = '2023-09-20'
      console.log(req.query);
      const {
        keyword,
        matter,
        change,
        solution,
        compliment
      } = req.body;
      console.log(req.body)
      const createMindDiaryResponse = await calendarService.createMindDiary(
        user_id,
        date,
        keyword,
        matter,
        change,
        solution,
        compliment
      );
      if (createMindDiaryResponse == "성공") {
        const queryString = querystring.stringify(req.query);
        return res.status(200).send(`
          <script>
            if (confirm('마음 일기 등록에 성공했습니다.')) {
              window.location.href = "/calendar?${queryString}";
            }
          </script>
        `);
      } else {
        const queryString = querystring.stringify(req.query);
        return res.send(`
          <script>
            if (confirm('마음 일기 등록에 실패했습니다.')) {
              window.location.href = "/calendar?${queryString}";
            }
          </script>
        `);
      }
  }
  else {
    return res.redirect('/');
  }
}