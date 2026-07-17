const GUIDE_NAME = "2026 Annapolis Boat Shows Do\'s & Don\'ts Guide";
const GUIDE_URL = "https://raw.githubusercontent.com/dscottpoii/boat-pro-summer-leadmagnet/main/2026-Annapolis-Boat-Shows-Dos-and-Donts-Guide.pdf";
const LEADS_SHEET = "Leads";

function doPost(e) {
  try {
    const data = e.parameter || {};
    const firstName = clean_(data.firstName);
    const lastName = clean_(data.lastName);
    const email = clean_(data.email).toLowerCase();

    if (!firstName || !lastName || !isValidEmail_(email)) {
      return json_({ ok: false, error: "Valid first name, last name, and email are required." });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("This script must be attached to the Google Sheet used for Boat Pro leads.");
    }

    const sheet = spreadsheet.getSheetByName(LEADS_SHEET) || spreadsheet.insertSheet(LEADS_SHEET);
    ensureHeaders_(sheet);
    sheet.appendRow([new Date(), firstName, lastName, email, GUIDE_NAME, GUIDE_URL, "Website", "Email sent"]);

    MailApp.sendEmail({
      to: email,
      subject: "Your 2026 Annapolis Boat Shows Do\'s & Don\'ts Guide",
      htmlBody:
        "<p>Hi " + escapeHtml_(firstName) + ",</p>" +
        "<p>Thanks for joining Boat Pro USA. Your complimentary 2026 Annapolis Boat Shows guide is ready:</p>" +
        '<p><a href="' + GUIDE_URL + '" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Download Your Free Guide</a></p>' +
        "<p>Inside you\'ll find show dates, planning advice, buying strategies, Annapolis local tips, and a printable checklist.</p>" +
        "<p>See you at the show,<br>Boat Pro USA</p>",
      name: "Boat Pro USA"
    });

    return json_({ ok: true, guideUrl: GUIDE_URL });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: error.message });
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "First Name", "Last Name", "Email", "Guide", "Guide URL", "Source", "Status"]);
    sheet.setFrozenRows(1);
  }
}

function clean_(value) {
  return String(value || "").trim();
}

function isValidEmail_(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\'/g, "&#039;");
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
