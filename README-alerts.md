# 🚨 GA4 Monitoring – Alerts Add-on

This README documents the optional **alerting functionality** for the GA4 monitoring script. The core functions for real-time and hourly tracking (`runKPIsReport`, `runActiveUsersReport`, `runHourlyReport`) are already documented in the main `README.md`.

---

## 🔔 Alerting Logic (Optional)

This add-on introduces anomaly detection and alerting based on hourly GA4 metrics.

### How It Works

After aggregating and comparing hourly data, `sendAlerts()` scans for anomalies and flags significant metric changes in event activity.

---

## 📈 Alerting Components

### 1. `insertAndProcessData(data)`

- Aggregates hourly GA4 data by brand, hour, and event.
- Stores metrics like `totalUsers`, `sessions`, and `eventCount` for each event.
- Writes the processed data into the `Metrics Alerts` sheet.

### 2. `compareMetrics()`

- Compares the same hour across two consecutive days (e.g., 2 PM today vs 2 PM yesterday).
- Calculates percentage differences for each metric per event.
- Outputs to the `Alerts Log` sheet.

### 3. `sendAlerts()`

- Triggers alerts when:
  - Drop ≥ 300% → `numDiff ≤ -3`
  - Spike ≥ 500% → `numDiff ≥ +5`
- Uses **hundred-based percentage scaling**:
  - `-3` = -300%
  - `+5` = +500%
- Filters out alerts where both values are < 10 (to avoid noise).
- Writes results to the `Alerts` sheet.
- Adds conditional formatting to highlight changes.
- Can send email notifications (disabled by default).

---

## 📩 Email Notifications

To enable email alerts:

1. Open the `sendAlerts()` function.
2. Find and update this line:

```javascript
// GmailApp.sendEmail("your@email.com", "Metrics Alert", "", { htmlBody });
```

3. Replace with your address and uncomment:

```javascript
GmailApp.sendEmail("alerts@yourcompany.com", "Metrics Alert", "", { htmlBody });
```

---

## 🧾 Required Google Sheet Tabs

Ensure your spreadsheet includes the following tabs:

| Sheet Name              | Purpose                                                        |
|------------------------|----------------------------------------------------------------|
| `Metrics Alerts`       | Aggregated hourly data used for comparison                     |
| `Alerts Log`           | Raw day-over-day comparison with % differences                 |
| `Alerts`               | Filtered sheet containing alert-worthy metric deviations       |

The base sheets from the main script should also be present:

| Sheet Name               | Purpose                                      |
|-------------------------|----------------------------------------------|
| `KPIs`                  | Real-time event metrics (from runKPIsReport) |
| `Active Users`          | Real-time user/page metrics                  |
| `Hourly(Previous Period)` | Raw GA4 hourly data for today & yesterday |

---

## 📎 Linked Resources Used in Script

These links are used inside the alerting logic for reporting and email content:

- 📄 [Google Sheet Report](https://docs.google.com/spreadsheets/d/1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q)
- 📊 [Looker Studio Dashboard](https://lookerstudio.google.com/reporting/c9c3c3c0-13e7-4680-9190-6724d202d018)

> These are hardcoded into the script and should be updated if you're using a different Sheet or dashboard.

---

## 🛠 Deployment Notes

- This is **optional** functionality.
- It can be run in parallel with your existing script or in a staging environment.
- Use time-based triggers if automation is needed.
- Email functionality is off by default and must be manually enabled.

---

## 👤 Author

**Naren**  
📧 [your@email.com]
