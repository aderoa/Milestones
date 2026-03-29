/**
 * Google Apps Script — Milestones Receiver
 * 
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 * Then set the web app URL as the POST target in milestones_to_sheet.py
 * 
 * SETUP:
 * 1. Open your Recap Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Deploy → New Deployment → Web App
 * 5. Set "Execute as" = Me, "Who has access" = Anyone
 * 6. Copy the web app URL
 * 7. Set as APPS_SCRIPT_URL env var or pass to --post flag
 */

// CONFIG: Update these to match your Sheet
const MILESTONES_SHEET_NAME = "Milestones";  // Tab name for milestones output
const SNAPSHOT_SHEET_NAME = "Snapshot";        // Tab name for career totals snapshot
const MILESTONES_START_ROW = 2;                // Row 1 = header, data starts row 2

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "update_milestones") {
      return updateMilestones(data.milestones);
    }
    
    if (data.action === "update_snapshot") {
      return updateSnapshot(data.snapshot);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateMilestones(milestones) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MILESTONES_SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(MILESTONES_SHEET_NAME);
    sheet.getRange(1, 1, 1, 5).setValues([["PLAYER", "", "PASSED", "CATEGORY", "RANK"]]);
  }
  
  // Clear previous milestones (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Write new milestones
  if (milestones && milestones.length > 0) {
    const rows = milestones.map(m => [
      m.player || "",
      "",  // RAT column (unused)
      m.passed || "",
      m.category || "",
      m.rank || "",
    ]);
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  
  // Add timestamp
  sheet.getRange(1, 7).setValue("Last updated");
  sheet.getRange(1, 8).setValue(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: `${milestones.length} milestones written`,
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateSnapshot(snapshot) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SNAPSHOT_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SNAPSHOT_SHEET_NAME);
    sheet.getRange(1, 1, 1, 5).setValues([["STAT", "RANK", "PLAYER_NAME", "TOTAL", "ACTIVE"]]);
  }
  
  // Clear previous data
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }
  
  // Write new snapshot
  if (snapshot && snapshot.length > 0) {
    const rows = snapshot.map(s => [s.stat, s.rank, s.name, s.total, s.active ? "TRUE" : "FALSE"]);
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  
  sheet.getRange(1, 7).setValue("Snapshot date");
  sheet.getRange(1, 8).setValue(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: `${snapshot.length} entries written`,
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function — run manually to verify Sheet access
function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Sheet name: " + ss.getName());
  Logger.log("Milestones tab: " + (ss.getSheetByName(MILESTONES_SHEET_NAME) ? "exists" : "will be created"));
  Logger.log("Snapshot tab: " + (ss.getSheetByName(SNAPSHOT_SHEET_NAME) ? "exists" : "will be created"));
}
