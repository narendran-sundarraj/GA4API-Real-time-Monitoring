
# GA4 Realtime Monitoring – Full Documentation

This repository contains a **Google Apps Script** used to:
- Pull real-time and hourly GA4 data
- Store it in Google Sheets
- Filter, transform, and analyze KPIs
- Generate alert-ready data views

All this data is used and visualized via a **Realtime Monitoring Dashboard in Looker Studio**.

---

## 📁 Files in this Repository

| File | Description |
|------|-------------|
| [`GA4_AlertScript.js`](GA4_AlertScript.js) | Full Google Apps Script code |
| `README.md` | You’re here – full documentation |

---

## 📊 Connected Dashboards & Sheets

| Type | Link |
|------|------|
| **Looker Studio** | [Real-Time KPI Monitoring Dashboard](https://lookerstudio.google.com/reporting/c9c3c3c0-13e7-4680-9190-6724d202d018) |
| **Google Sheet** | [GA4 Realtime Source Sheet](https://docs.google.com/spreadsheets/d/1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q/edit?usp=sharing) |

These dashboards are powered directly by the Sheets updated by this script.

---

## ✅ Setup Instructions

1. **Enable GA4 API**  
   In Apps Script, enable **Google Analytics Data API** under "Services".

2. **Create Google Sheet Tabs**  
   Ensure the following sheets exist:
   - `KPIs`
   - `Active Users`
   - `Hourly (Previous Period)`

3. **Set Triggers**

| Function            | Frequency     | Description                          |
|---------------------|---------------|--------------------------------------|
| `runKPIsReport()`   | Every 5 mins  | Also calls `runActiveUsersReport()`  |
| `runHourlyReport()` | Every hour    | Hourly trend analysis                |

---

## 🧠 Function-by-Function Breakdown

### 🔹 `runKPIsReport()`

- **Purpose**: Pulls realtime GA4 key event data
- **Data Source**: GA4 Realtime API (last 30 minutes)
- **Filters**: Only includes events:
  - `Mod_NRC`
  - `Mod_NDC`
  - `Mod_RDC`
  - `Mod_Casino_Bet_Placed`
  - `Mod_Sportsbook_Bet_Placed`
- **Output**: Writes filtered rows to `KPIs` sheet
- **Also Calls**: `runActiveUsersReport()`

---

### 🔹 `runActiveUsersReport()`

- **Purpose**: Fetches real-time active user and pageview metrics
- **Metrics**: `activeUsers`, `PageViews`
- **Dimensions**: `streamName`, `country`, `minutesAgo`, `deviceCategory`
- **Output**: Writes all rows to `Active Users` sheet (no filtering)

---

### 🔹 `runHourlyReport()`

- **Purpose**: Pulls historical hourly GA4 data (yesterday through today)
- **Metrics**: `totalUsers`, `sessions`, `eventCount`
- **Dimensions**: `streamName`, `country`, `eventName`, `date`, `hour`, `dateHour`
- **Filters**:
  - Only includes events:
    - `Mod_NRC`
    - `Mod_NDC`
    - `Mod_RDC`
    - `Mod_Casino_Bet_Placed`
    - `Mod_Sportsbook_Bet_Placed`
    - `page_view`
  - Only includes hours up to **2 hours before the current time**
- **Output**: Writes filtered results to `Hourly (Previous Period)` sheet

---

## 📎 Full Script

The complete source code is available here:  
👉 [`GA4_AlertScript.js`](GA4_AlertScript.js)

You can copy/paste or import it into your Google Apps Script project.

---

## 🔒 Permissions Required

- Google Analytics Data API  
- Spreadsheet read/write access

---
