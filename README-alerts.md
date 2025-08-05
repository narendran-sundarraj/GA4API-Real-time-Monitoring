# 📊 GA4 Realtime Monitoring & Alerting Script

This script collects and processes **real-time and historical data** from Google Analytics 4 (GA4) and stores it in **Google Sheets** for monitoring and optional alerting.

---

## 🧩 Script Overview

The script is organized into the following key functions:

| Function Name           | Purpose                                                                 |
|------------------------|-------------------------------------------------------------------------|
| `runKPIsReport()`      | Fetches real-time KPI events (last 30 minutes)                          |
| `runActiveUsersReport()` | Collects real-time active user & page view data                       |
| `runHourlyReport()`    | Fetches hourly event data for yesterday and today                       |
| `insertAndProcessData()` | Aggregates hourly GA4 data by brand/event/hour for analysis           |
| `compareMetrics()`     | Compares today's data vs yesterday's by hour and event                  |
| `sendAlerts()`         | Flags significant spikes/drops and (optionally) sends an alert email    |

---

## 📁 Required Google Sheets Tabs

Make sure your spreadsheet contains the following tabs:

| Sheet Name              | Purpose                                                        |
|------------------------|----------------------------------------------------------------|
| `KPIs`                 | Stores real-time KPI events                                     |
| `Active Users`         | Stores active user metrics from GA4                             |
| `Hourly(Previous Period)` | Stores hourly historical GA4 data                           |
| `Metrics Alerts`       | Aggregated hourly data for comparison (auto-created if missing) |
| `Alerts Log`           | Output of hourly comparisons showing % differences              |
| `Alerts`               | Filtered list of significant anomalies for review/alerts        |

---

## 📍 Google Sheet & Dashboard Links

These are embedded directly in the script and used in reports/emails:

- 🔗 **Google Sheet Report:**  
  [https://docs.google.com/spreadsheets/d/1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q](https://docs.google.com/spreadsheets/d/1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q)

- 📊 **Looker Studio Dashboard:**  
  [https://lookerstudio.google.com/reporting/c9c3c3c0-13e7-4680-9190-6724d202d018](https://lookerstudio.google.com/reporting/c9c3c3c0-13e7-4680-9190-6724d202d018)

---

## 🔔 Alerting Logic (Optional)

### How It Works

- After aggregating and comparing hourly data, `sendAlerts()` scans for anomalies.
- It flags events where the percentage change is large **and** the volume is meaningful.

### Trigger Conditions

Alerts are triggered when:

- **Drop ≥ 300%** → `numDiff ≤ -3`
- **Spike ≥ 500%** → `numDiff ≥ +5`

These use **"hundred-based percentage scaling"**, e.g.:

```text
-3  = -300%
+5  = +500%
```

Additionally:

- Both values (today and yesterday) must be ≥ 10
- Alert entries are stored in the `Alerts` sheet

---

### 📩 Email Notifications

Email alerts are **disabled by default**.

To enable:

1. Open the `sendAlerts()` function.
2. Find the following line:

```javascript
// GmailApp.sendEmail("your@email.com", "Metrics Alert", "", { htmlBody });
```

3. Replace the email and uncomment it:

```javascript
GmailApp.sendEmail("alerts@yourcompany.com", "Metrics Alert", "", { htmlBody });
```

4. Authorize Gmail access when prompted.

---

## ⚙️ Deployment Notes

- The script is designed for **Google Apps Script** environment (bound to a Google Sheet).
- You can run each main function via a time-based trigger or manual execution.
- `sendAlerts()` is optional and currently **not live in production**.
- If your current production version doesn't include alerting, keep that as-is and run this in parallel or in a staging sheet.

---

## 👤 Author

**Naren**  
📧 [your@email.com]
