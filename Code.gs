/**
 * kt ds 컨소시엄 교육 신청인원 현황 — 데이터 API (2026-11-04 리뉴얼)
 *
 * 화면은 GitHub Pages(https://ktdscon.github.io/headcount/)가 맡고,
 * 이 스크립트는 시트 값을 JSON으로만 내려준다.
 *   - ?format=json  → 과정 목록 JSON (10분 캐시)
 *   - 그 외         → 새 화면 주소로 안내하는 가벼운 페이지 (예전 /exec 링크 대비)
 *
 * 시트 구조(기존과 동일, 4행부터 데이터):
 *   D열 상태(모집중/개강/폐강/완료 등)  F열 신청현황  G열 교육시작일  H열 교육수료일  K열 과정명
 */

var PAGE_URL = 'https://ktdscon.github.io/headcount/';
var CACHE_KEY = 'headcount_v2';
var CACHE_SECONDS = 600; // 10분. 시트를 고친 뒤 바로 보이게 하려면 clearCache()를 한 번 실행

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.format === 'json') {
    return ContentService.createTextOutput(getJson_())
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutput(
    '<base target="_top"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<div style="font-family:sans-serif;text-align:center;padding:48px 16px">' +
    '<p style="font-size:17px;margin:0 0 20px">신청인원 현황 페이지 주소가 바뀌었습니다.</p>' +
    '<a href="' + PAGE_URL + '" style="display:inline-block;background:#E5002B;color:#fff;' +
    'padding:13px 24px;border-radius:6px;font-weight:700;text-decoration:none">현황 페이지 열기</a></div>'
  ).setTitle('kt ds 컨소시엄 교육 신청인원 현황 조회')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getJson_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(CACHE_KEY);
  if (hit) return hit;
  var json = JSON.stringify(buildData_());
  try { cache.put(CACHE_KEY, json, CACHE_SECONDS); } catch (err) { /* 100KB 초과 시 캐시 생략 */ }
  return json;
}

/** 시트를 고친 직후 바로 반영하고 싶을 때 편집기에서 한 번 실행 */
function clearCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
}

function buildData_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var tz = Session.getScriptTimeZone() || 'Asia/Seoul';
  var lastRow = sheet.getLastRow();
  var out = { generatedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"), courses: [] };
  if (lastRow < 4) return out;

  var values = sheet.getRange(4, 1, lastRow - 3, 11).getValues();
  var today = new Date(); today.setHours(0, 0, 0, 0);

  function toDate(v) {
    if (!v) return null;
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? null : v;
    var d = new Date(String(v).split('(')[0].trim().replace(/\./g, '-'));
    return isNaN(d.getTime()) ? null : d;
  }
  function fmt(v) {
    var d = toDate(v);
    return d ? Utilities.formatDate(d, tz, 'yyyy.MM.dd') : String(v || '').split('(')[0].trim();
  }

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var statusD = String(row[3] || '');
    var applicant = Number(row[5]) || 0;
    var start = row[6], end = row[7];
    var name = String(row[10] || '').trim();

    if (!name) continue;
    if (name.indexOf('[27기 채용예정자]') > -1 || name.indexOf('풀스택 전문가 양성과정') > -1) continue;
    if (statusD.indexOf('폐강') > -1 || statusD.indexOf('완료') > -1) continue;
    // 기존 규칙 유지: 교육시작일(G열)이 오늘 이전이면 제외
    var startD = toDate(start);
    if (startD && startD < today) continue;

    // 기존 규칙 유지: D열 '개강' 또는 10명 이상 → 개강 확정 / D열 '예정' → 모집 예정 / 그 외 모집 중
    var status = '모집 중';
    if (statusD.indexOf('개강') > -1 || applicant >= 10) status = '개강 확정';
    else if (statusD.indexOf('예정') > -1) status = '모집 예정';

    out.courses.push({
      name: name,
      start: start ? fmt(start) : '',
      end: end ? fmt(end) : '',
      applicant: applicant,
      status: status
    });
  }
  return out;
}
