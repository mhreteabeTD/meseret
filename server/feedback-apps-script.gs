/**
 * Meseret feedback → Google Sheet.
 * Paste this into Extensions → Apps Script of the feedback Sheet, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the Web app URL into FEEDBACK_URL in app/app.js.
 * Each report becomes one row. Screenshots are saved in a Drive folder and linked in the row.
 */
const SHEET_NAME = 'Feedback';
const FOLDER_NAME = 'Meseret feedback screenshots';
const HEADERS = ['Time', 'Type', 'Message', 'Where', 'Question on screen', 'Grades', 'Language', 'Name / phone', 'Device', 'App version', 'Screenshot', 'Status', 'Notes', 'Open'];

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.app !== 'meseret') return out({ ok: false, error: 'bad app' });
    const msg = String(d.message || '').slice(0, 3000);
    if (!msg.trim() && !d.shot) return out({ ok: false, error: 'empty' });
    const sheet = getSheet();
    let shotUrl = '';
    if (d.shot && String(d.shot).length < 1500000) shotUrl = saveShot(d.shot, d.at);
    sheet.appendRow([
      d.at ? new Date(d.at) : new Date(), clip(d.type, 60), msg, clip(d.where, 600), clip(d.question, 500),
      clip(d.grades, 40), clip(d.lang, 10), clip(d.contact, 120), clip(d.device, 200), clip(d.version, 20), shotUrl, 'New', '',
      /^https:\/\/[\w.-]+\.github\.io\//.test(String(d.link || '')) ? '=HYPERLINK("' + String(d.link).replace(/"/g, '') + '","Open")' : ''
    ]);
    if (sheet.getRange(1, 14).getValue() !== 'Open') sheet.getRange(1, 14).setValue('Open').setFontWeight('bold').setBackground('#DAF4E6');
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Visiting the URL in a browser shows this: a quick way to check the deployment works.
function doGet() { return out({ ok: true, service: 'meseret-feedback' }); }

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#DAF4E6');
    sh.setColumnWidth(3, 360); sh.setColumnWidth(4, 220); sh.setColumnWidth(5, 260);
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Seen', 'Fixed', 'Won\'t fix'], true).build();
    sh.getRange(2, 12, 2000, 1).setDataValidation(rule);
  }
  return sh;
}

function saveShot(dataUrl, at) {
  const m = String(dataUrl).match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/);
  if (!m) return '';
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  const blob = Utilities.newBlob(Utilities.base64Decode(m[3]), m[1], 'shot-' + (at || Date.now()) + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]));
  return folder.createFile(blob).getUrl();
}

function clip(v, n) { return String(v == null ? '' : v).slice(0, n); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
