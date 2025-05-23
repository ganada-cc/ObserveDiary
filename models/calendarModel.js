// 캘린더 조회
async function getSelectedCalendar(pool, selectedCalendarParams) {
  const getCheck_listQuery = `
    SELECT check_content, is_check
    FROM check_list
    WHERE user_id = ?
    AND calendar_id = (
      SELECT calendar_id
      FROM calendar
      WHERE user_id = ? 
      AND date = ?
    );
  `;

  const getCalendarQuery = `
    SELECT sleep_time , diary
    FROM calendar
    WHERE user_id = ?
    AND calendar_id = (
      SELECT calendar_id
      FROM calendar
      WHERE user_id = ? 
      AND date = ?
    );
  `;

  const getSymptomQuery = `
    SELECT symptom_name, degree
    FROM symptom
    WHERE user_id = ?
    AND calendar_id = (
      SELECT calendar_id
      FROM calendar
      WHERE user_id = ? 
        AND date = ?
    )
    AND symptom_name IN ('기억장애', '언어장애', '배회', '계산능력 저하', '성격 및 감정의 변화', '이상행동');
  `;

  const [checkRows] = await pool.query(getCheck_listQuery, selectedCalendarParams);
  const check_list = checkRows.length > 0 ? checkRows.map(row => ({
    content: row.check_content,
    is_check: row.is_check
  })) : [];

  const [calendarRows] = await pool.query(getCalendarQuery, selectedCalendarParams);
  const calendar = {
    sleep_time: "",
    diary: ""
  };
  if (calendarRows.length > 0) {
    calendar.sleep_time = calendarRows[0].sleep_time;
    calendar.diary = calendarRows[0].diary;
  }

  const [symptomRows] = await pool.query(getSymptomQuery, selectedCalendarParams);
  const symptom_list = symptomRows.length > 0 ? symptomRows.map(row => ({
    symptom_name: row.symptom_name,
    degree: row.degree
  })) : [];

  return { check_list, calendar, symptom_list };
}

// file_memories 조회
async function selectCalendar(pool, userId, date) {
  const selectCalendarQuery =`
    SELECT server_name, extension
    FROM file_memories
    WHERE user_id = '${userId}'
      AND calendar_id = (
        SELECT calendar_id
        FROM calendar
        WHERE user_id = '${userId}'
          AND date = '${date}'
      );
  `;
  const [userRow] = await pool.query(selectCalendarQuery);
  return userRow;
}


// 데이터 삽입
async function insertCalInfo(pool, deleteParams, insertParams, getIdParams, user_id, check_content, is_check, symptom_range) {
  const deleteQuery = `DELETE FROM calendar WHERE user_id = ? AND date = ?`;
  const insertQuery = `INSERT INTO calendar (user_id, date, sleep_time, diary) VALUES (?, ?, ?, ?)`;
  const getIdQuery = `SELECT calendar_id FROM calendar WHERE user_id = ? AND date = ?`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(deleteQuery, deleteParams);
    await connection.query(insertQuery, insertParams);

    const [rows] = await connection.query(getIdQuery, getIdParams);
    const calendar_id = rows[0].calendar_id;

    const checkInsertQuery = `INSERT INTO check_list (calendar_id, user_id, check_content, is_check) VALUES (?, ?, ?, ?)`;
    for (let i = 0; i < check_content.length; i++) {
      await connection.query(checkInsertQuery, [calendar_id, user_id, check_content[i], is_check[i]]);
    }

    const symptomInsertQuery = `INSERT INTO symptom (calendar_id, user_id, symptom_name, degree) VALUES (?, ?, ?, ?)`;
    const symptom_text = ["기억장애", "언어장애", "배회", "계산능력 저하", "성격 및 감정의 변화", "이상행동"];
    for (let i = 0; i < symptom_text.length; i++) {
      await connection.query(symptomInsertQuery, [calendar_id, user_id, symptom_text[i], symptom_range[i]]);
    }

    await connection.commit();
    return "성공";
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  selectCalendar,
  getSelectedCalendar,
  insertCalInfo
};
