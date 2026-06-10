function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 4) {
    return HtmlService.createHtmlOutput("조회 가능한 최신 교육 과정 데이터가 없습니다.");
  }
  
  // A(1) ~ K(11) 범위의 데이터를 가져옵니다.
  var values = sheet.getRange(4, 1, lastRow - 3, 11).getValues();
  var courseList = [];
  
  var today = new Date();
  today.setHours(0, 0, 0, 0); // 날짜 비교를 위해 시간 초기화

  // 문자열을 YYYY-MM-DD Date 객체로 변환하는 헬퍼 함수
  function parseDate(value) {
    if (!value) return null;
    var dateStr = value.toString().split('(')[0].trim().replace(/\./g, '-');
    var parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    
    var statusD = row[3] || "";    // D열 (모집중/개강/폐강 등)
    var applicant = row[5] || 0;   // F열 (신청현황)
    var startDate = row[6] || "";  // G열 (교육시작일)
    var endDate = row[7] || "";    // H열 (교육수료일)
    var name = row[10] || "";      // K열 (과정명)

    // [27기 채용예정자] 풀스택 과정 리스트에서 제외
    if (name.includes("[27기 채용예정자]") || name.includes("풀스택 전문가 양성과정")) {
      continue;
    }

    // 폐강, 완료된 과정 및 과정명이 없으면 제외
    if (statusD.includes("폐강") || statusD.includes("완료") || !name) {
      continue;
    }

    // 교육수료일(H열)을 Date 객체로 변환하여 오늘(실시간) 이전 과정 제외
    var endDateTime = parseDate(endDate);
    if (endDateTime && endDateTime < today) {
      continue;
    }

    // 교육 일정 텍스트 생성
    var periodText = "";
    if (startDate && endDate) {
      var sStr = startDate.toString().split('(')[0].trim();
      var eStr = endDate.toString().split('(')[0].trim();
      periodText = sStr + " ~ " + eStr;
    }

    courseList.push({
      name: name,
      period: periodText,
      applicant: applicant
    });
  }
  
  var template = HtmlService.createTemplateFromFile('index');
  template.data = courseList;
  
  return template.evaluate()
             .setTitle('kt ds 컨소시엄 교육 신청인원 현황 조회')
             .addMetaTag('viewport', 'width=device-width, initial-scale=1')
             .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
