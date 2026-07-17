const GUIDE_NAME = "2026 Annapolis Boat Shows Do's & Don'ts Guide";
const GUIDE_URL = "https://raw.githubusercontent.com/dscottpoii/boat-pro-summer-leadmagnet/main/2026-Annapolis-Boat-Shows-Dos-and-Donts-Guide.pdf";
const LEADS_SHEET = "Leads";
const UNSUBSCRIBES_SHEET = "Unsubscribes";
const EMAIL_COOLDOWN_SECONDS = 15 * 60;
const DAILY_SEND_LIMIT = 100;
const MINIMUM_FORM_TIME_MS = 2500;

function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};
    const firstName = clean_(data.firstName);
    const lastName = clean_(data.lastName);
    const email = clean_(data.email).toLowerCase();
    const honeypot = clean_(data.website);
    const startedAt = Number(data.startedAt || 0);

    // Silently accept bot-filled honeypot submissions without sending email.
    if (honeypot) {
      return json_({ ok: true });
    }

    if (!firstName || !lastName || !isValidEmail_(email)) {
      return json_({ ok: false, error: "Valid first name, last name, and email are required." });
    }

    if (!startedAt || Date.now() - startedAt < MINIMUM_FORM_TIME_MS) {
      return json_({ ok: false, error: "Please wait a moment and submit the form again." });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("This script must be attached to the Google Sheet used for Boat Pro leads.");
    }

    if (isUnsubscribed_(spreadsheet, email)) {
      return json_({
        ok: false,
        error: "This email address is unsubscribed. Contact Boat Pro USA if you want to subscribe again."
      });
    }

    enforceRateLimits_(email);

    const sheet = spreadsheet.getSheetByName(LEADS_SHEET) || spreadsheet.insertSheet(LEADS_SHEET);
    ensureLeadHeaders_(sheet);
    sheet.appendRow([new Date(), firstName, lastName, email, GUIDE_NAME, GUIDE_URL, "Website", "Pending"]);
    const row = sheet.getLastRow();

    try {
      const unsubscribeUrl = createUnsubscribeUrl_(email);
      MailApp.sendEmail({
        to: email,
        subject: "Your 2026 Annapolis Boat Shows Do's & Don'ts Guide",
        htmlBody:
          "<p>Hi " + escapeHtml_(firstName) + ",</p>" +
          "<p>Thanks for joining Boat Pro USA. Your complimentary 2026 Annapolis Boat Shows guide is ready:</p>" +
          '<p><a href="' + GUIDE_URL + '" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Download Your Free Guide</a></p>' +
          "<p>Inside you'll find show dates, planning advice, buying strategies, Annapolis local tips, and a printable checklist.</p>" +
          "<p>See you at the show,<br>Boat Pro USA</p>" +
          '<hr><p style="font-size:12px;color:#64748b;">You received this because you requested a Boat Pro USA guide. ' +
          '<a href="' + unsubscribeUrl + '">Unsubscribe from future marketing emails</a>.</p>',
        name: "Boat Pro USA"
      });
      sheet.getRange(row, 8).setValue("Email sent");
      return json_({ ok: true, guideUrl: GUIDE_URL });
    } catch (mailError) {
      sheet.getRange(row, 8).setValue("Email failed: " + mailError.message);
      throw mailError;
    }
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: error.message || "Unable to process the request." });
  }
}

function doGet(e) {
  const action = clean_(e && e.parameter && e.parameter.action);
  const email = clean_(e && e.parameter && e.parameter.email).toLowerCase();
  const token = clean_(e && e.parameter && e.parameter.token);

  if (action !== "unsubscribe" || !isValidEmail_(email) || !token || token !== tokenFor_(email)) {
    return HtmlService.createHtmlOutput(
      "<h1>Invalid unsubscribe link</h1><p>Please contact Boat Pro USA for assistance.</p>"
    );
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(UNSUBSCRIBES_SHEET) || spreadsheet.insertSheet(UNSUBSCRIBES_SHEET);
  ensureUnsubscribeHeaders_(sheet);

  if (!isUnsubscribed_(spreadsheet, email)) {
    sheet.appendRow([new Date(), email, "Email link"]);
  }
  markLeadUnsubscribed_(spreadsheet, email);

  return HtmlService.createHtmlOutput(
    "<h1>You are unsubscribed</h1><p>" + escapeHtml_(email) +
    " will no longer receive Boat Pro USA marketing emails.</p>"
  );
}

function enforceRateLimits_(email) {
  const cache = CacheService.getScriptCache();
  const emailKey = "sent:" + digest_(email);

  if (cache.get(emailKey)) {
    throw new Error("A guide was recently requested for this email. Please check your inbox or try again later.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const key = "dailySends:" + day;
    const count = Number(properties.getProperty(key) || 0);

    if (count >= DAILY_SEND_LIMIT) {
      throw new Error("The daily guide limit has been reached. Please try again tomorrow.");
    }

    properties.setProperty(key, String(count + 1));
    cache.put(emailKey, "1", EMAIL_COOLDOWN_SECONDS);
  } finally {
    lock.releaseLock();
  }
}

function createUnsubscribeUrl_(email) {
  const baseUrl = ScriptApp.getService().getUrl();
  return baseUrl +
    "?action=unsubscribe&email=" + encodeURIComponent(email) +
    "&token=" + encodeURIComponent(tokenFor_(email));
}

function tokenFor_(email) {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty("UNSUBSCRIBE_SECRET");

  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty("UNSUBSCRIBE_SECRET", secret);
  }

  const signature = Utilities.computeHmacSha256Signature(email, secret);
  return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, "");
}

function digest_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
  ).replace(/=+$/, "");
}

function isUnsubscribed_(spreadsheet, email) {
  const sheet = spreadsheet.getSheetByName(UNSUBSCRIBES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return false;
  }

  const emails = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getDisplayValues();
  return emails.some(function(row) {
    return clean_(row[0]).toLowerCase() === email;
  });
}

function markLeadUnsubscribed_(spreadsheet, email) {
  const sheet = spreadsheet.getSheetByName(LEADS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return;
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  values.forEach(function(row, index) {
    if (clean_(row[3]).toLowerCase() === email) {
      sheet.getRange(index + 2, 8).setValue("Unsubscribed");
    }
  });
}

function ensureLeadHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "First Name", "Last Name", "Email", "Guide", "Guide URL", "Source", "Status"]);
    sheet.setFrozenRows(1);
  }
}

function ensureUnsubscribeHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Source"]);
    sheet.setFrozenRows(1);
  }
}

function clean_(value) {
  return String(value || "").trim();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
