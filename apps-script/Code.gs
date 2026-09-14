/**
 * CAPBOOST landing page — lead receiver
 * ------------------------------------------------------------
 * Writes each form submission into the existing CAPBOOST leads sheet.
 *
 * SETUP
 * 1. Go to https://script.google.com  >  New project.
 * 2. Delete whatever is there, paste this whole file, and rename the project
 *    (e.g. "CAPBOOST Landing — Leads").
 * 3. Run checkSetup() once from the editor. Google will ask you to approve
 *    permissions — approve them. The log tells you which tab it found.
 * 4. Deploy > New deployment > type: Web app
 *      Execute as:      Me
 *      Who has access:  Anyone
 *    Copy the /exec URL it gives you.
 * 5. Paste that URL into SHEET_ENDPOINT at the bottom of index.html.
 *
 * This script targets the sheet by ID, so it does NOT need to live inside the
 * spreadsheet — a standalone project is fine, and is easier to redeploy.
 *
 * SCOPES: this asks for Google Sheets access only. It deliberately does not use
 * MailApp — that would add a "send email as you" grant, and every lead already
 * lands in the sheet and arrives on WhatsApp.
 *
 * IMPORTANT: after any edit to this file you must create a NEW deployment
 * (or edit the existing one and pick "New version"), otherwise the live
 * URL keeps running the old code.
 */

/* https://docs.google.com/spreadsheets/d/<THIS PART>/edit#gid=<AND THIS> */
var SPREADSHEET_ID = '1hvcujP0Fh7eKjIu0F0v32VP98CE8-KkpNwL6u4gs03E';
var SHEET_GID      = 1006515679;

var TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Column order, matching the header row already in the sheet. Rows are written
 * positionally, so if you reorder the columns in the sheet you must reorder
 * this list to match.
 */
var COLUMNS = [
  'Timestamp',
  '公司名称',
  '姓名',
  '联系方式',
  'WhatsApp号码',
  '公司运营多久',
  '从事行业',
  '寻找资金金额',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'fbclid',
  'gclid',
  '公司年营业额'   /* added last on purpose — see note below */
];

/* NOTE: 公司年营业额 is appended as column O rather than slotted next to
   寻找资金金额, because the sheet already holds rows in the original 14-column
   order. Inserting mid-way would push every existing row's data one column right.
   Put the header text in cell O1 once and it lines up. */

/* ------------------------------------------------------------------ */

function sheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var all = ss.getSheets();

  /* Match on gid rather than tab name — the name can be renamed, the gid can't. */
  for (var i = 0; i < all.length; i++) {
    if (all[i].getSheetId() === SHEET_GID) return all[i];
  }

  /* gid not found (wrong copy of the sheet?) — fall back to the first tab
     rather than silently dropping the lead. */
  Logger.log('WARNING: no tab with gid ' + SHEET_GID + '; falling back to "' +
             all[0].getName() + '".');
  return all[0];
}

/** Run this once from the editor to approve permissions and confirm the target. */
function checkSetup() {
  var sh = sheet_();
  var header = sh.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  var msg = 'Writing to tab: "' + sh.getName() + '" (gid ' + sh.getSheetId() + ')\n' +
            'Rows so far: ' + sh.getLastRow() + '\n' +
            'Header found: ' + header.join(' | ');
  Logger.log(msg);
  return msg;
}

/**
 * Malaysian numbers arrive in every shape: 012-345 6789, +6012 3456789,
 * 60123456789. wa.me needs bare international digits, so normalise to 60…
 */
function waNumber_(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.indexOf('60') === 0) return d;        // already international
  if (d.charAt(0) === '0')   return '60' + d.slice(1);
  return '60' + d;                            // bare local, e.g. 123456789
}

/** Display form: +60 123456789 */
function prettyPhone_(raw) {
  var wa = waNumber_(raw);
  return wa ? '+60 ' + wa.slice(2) : String(raw || '');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = sheet_();

    /* Write into a row forced to plain-text format FIRST. appendRow() evaluates
       values the way typing them would, so "+60 12 345 6789" is read as a formula
       and lands as #ERROR!, and a bare digit string becomes a number that can lose
       leading zeros or flip to scientific notation. Formatting the row as text
       before setting values keeps every field exactly as sent. */
    var row = sh.getLastRow() + 1;
    var range = sh.getRange(row, 1, 1, COLUMNS.length);
    range.setNumberFormat('@');
    range.setValues([[
      Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm:ss'),
      d.company      || '',
      d.name         || '',
      prettyPhone_(d.phone),
      waNumber_(d.phone),
      d.years        || '',
      d.industry     || '',
      d.amount       || '',
      d.utm_source   || '',
      d.utm_medium   || '',
      d.utm_campaign || '',
      d.utm_content  || '',
      d.fbclid       || '',
      d.gclid        || '',
      d.revenue      || ''
    ]]);

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

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
