/**
 * CAPBOOST landing page — lead receiver
 * ------------------------------------------------------------
 * Writes each form submission into a Google Sheet.
 *
 * SETUP
 * 1. Open the Google Sheet you want leads to land in.
 * 2. Extensions > Apps Script. Delete whatever is there, paste this file.
 * 3. Set SHEET_NAME below to the tab name (default: "Leads").
 * 4. Run setupSheet() once from the editor and approve the permissions prompt.
 * 5. Deploy > New deployment > type: Web app
 *      Execute as:      Me
 *      Who has access:  Anyone
 *    Copy the /exec URL it gives you.
 * 6. Paste that URL into SHEET_ENDPOINT at the bottom of index.html.
 *
 * IMPORTANT: after any edit to this file you must create a NEW deployment
 * (or edit the existing one and pick "New version"), otherwise the live
 * URL keeps running the old code.
 */

var SHEET_NAME = 'Leads';

var HEADERS = [
  'Timestamp',
  '公司名称 Company',
  '姓名 Name',
  '联系方式 Phone',
  '运营多久 Years Operating',
  '行业 Industry',
  '资金金额 Amount Needed',
  'Source',
  'Page URL'
];

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1B2A4F')
      .setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160);
  }
  return 'Sheet ready: ' + SHEET_NAME;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }

    sh.appendRow([
      new Date(),
      d.company  || '',
      d.name     || '',
      d.phone    || '',
      d.years    || '',
      d.industry || '',
      d.amount   || '',
      d.source   || '',
      d.page     || ''
    ]);

    notify_(d);

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, note: 'CAPBOOST lead endpoint is live.' });
}

/**
 * Optional: email yourself on every new lead.
 * Set NOTIFY_EMAIL to '' to switch this off.
 */
var NOTIFY_EMAIL = '';

function notify_(d) {
  if (!NOTIFY_EMAIL) return;
  var body =
    '新的 CAPBOOST 询问\n\n' +
    '公司: '   + (d.company  || '-') + '\n' +
    '姓名: '   + (d.name     || '-') + '\n' +
    '联系: '   + (d.phone    || '-') + '\n' +
    '运营: '   + (d.years    || '-') + '\n' +
    '行业: '   + (d.industry || '-') + '\n' +
    '金额: '   + (d.amount   || '-') + '\n\n' +
    'Source: ' + (d.source   || '-');
  MailApp.sendEmail(NOTIFY_EMAIL, '新 Lead — ' + (d.company || d.name || 'CAPBOOST'), body);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
