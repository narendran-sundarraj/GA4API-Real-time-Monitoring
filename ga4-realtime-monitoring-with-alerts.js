/**
 * ============================================
 * GA4 Realtime Monitoring Script
 * ============================================
 *
 * This script fetches real-time and hourly data from Google Analytics 4 (GA4)
 * and writes it into Google Sheets for monitoring and alerting.
 *
 * The script includes:
 * 1. runKPIsReport()          → Real-time KPI events (last 30 minutes)
 * 2. runActiveUsersReport()   → Real-time active users and page views
 * 3. runHourlyReport()        → Historical hourly data for yesterday and today
 * 4. insertAndProcessData()   → Aggregates hourly data by event
 * 5. compareMetrics()         → Compares yesterday vs today by hour
 * 6. sendAlerts()             → Sends alert emails if significant changes detected
 *
 * Required Sheets:
 * - KPIs
 * - Active Users
 * - Hourly(Previous Period)
 * - Metrics Alerts
 * - Alerts Log
 * - Alerts
 */

// ============================================
// 1. Main KPIs Report (Realtime Events)
// ============================================
function runKPIsReport() {
	const propertyId = '335360279';

	const metric = AnalyticsData.newMetric();
	metric.name = 'eventCount';

	const dimensions = ['streamName', 'eventName', 'minutesAgo', 'country'].map(name => {
		const d = AnalyticsData.newDimension();
		d.name = name;
		return d;
	});

	const minuteRanges = AnalyticsData.newMinuteRange();
	minuteRanges.startMinutesAgo = 30;
	minuteRanges.endMinutesAgo = 0;

	const request = AnalyticsData.newRunRealtimeReportRequest();
	request.dimensions = dimensions;
	request.metrics = [metric];
	request.minuteRanges = [minuteRanges];
	request.limit = 250000;

	const report = AnalyticsData.Properties.runRealtimeReport(request, `properties/${propertyId}`);
	const sheet = SpreadsheetApp.getActive().getSheetByName("KPIs");
	sheet.getRange("A1:E").clear();

	const headers = [...report.dimensionHeaders.map(d => d.name), ...report.metricHeaders.map(m => m.name)];
	sheet.appendRow(headers);

	const selectedEvents = ["Mod_NRC", "Mod_NDC", "Mod_RDC", "Mod_Casino_Bet_Placed", "Mod_Sportsbook_Bet_Placed"];
	const rows = report.rows
		.filter(row => selectedEvents.includes(row.dimensionValues[1]?.value))
		.map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);

	sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

	// Trigger next function
	runActiveUsersReport();
}

// ============================================
// 2. Active Users Report (Realtime Metrics)
// ============================================
function runActiveUsersReport() {
	const propertyId = '335360279';

	const metrics = ['activeUsers', 'screenPageViews'].map(name => {
		const m = AnalyticsData.newMetric();
		m.name = name;
		return m;
	});

	const dimensions = ['streamName', 'country', 'minutesAgo', 'deviceCategory'].map(name => {
		const d = AnalyticsData.newDimension();
		d.name = name;
		return d;
	});

	const minuteRanges = AnalyticsData.newMinuteRange();
	minuteRanges.startMinutesAgo = 30;
	minuteRanges.endMinutesAgo = 0;

	const request = AnalyticsData.newRunRealtimeReportRequest();
	request.dimensions = dimensions;
	request.metrics = metrics;
	request.minuteRanges = [minuteRanges];
	request.limit = 250000;

	const report = AnalyticsData.Properties.runRealtimeReport(request, `properties/${propertyId}`);
	const sheet = SpreadsheetApp.getActive().getSheetByName("Active Users");
	sheet.getRange("A1:F").clear();

	const headers = [...report.dimensionHeaders.map(d => d.name), ...report.metricHeaders.map(m => m.name)];
	sheet.appendRow(headers);

	const rows = report.rows.map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);
	sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

// ============================================
// 3. Hourly Report (Historical Event Trends)
// ============================================
function runHourlyReport() {
	const propertyId = '335360279';
	const now = new Date();
	const currentHour = parseInt(Utilities.formatDate(now, 'Europe/Malta', 'HH'));

	const metrics = ['totalUsers', 'sessions', 'eventCount'].map(name => {
		const m = AnalyticsData.newMetric();
		m.name = name;
		return m;
	});

	const dimensions = ['streamName', 'country', 'eventName', 'date', 'hour', 'dateHour'].map(name => {
		const d = AnalyticsData.newDimension();
		d.name = name;
		return d;
	});

	const mapeventName = ["Mod_NRC", "Mod_NDC", "Mod_RDC", "Mod_Casino_Bet_Placed", "Mod_Sportsbook_Bet_Placed", "page_view"];
	const filterExpression = AnalyticsData.newFilterExpression();
	filterExpression.filter = AnalyticsData.newFilter();
	filterExpression.filter.fieldName = 'eventName';
	filterExpression.filter.inListFilter = AnalyticsData.newInListFilter();
	filterExpression.filter.inListFilter.values = mapeventName;

	const dateRange = AnalyticsData.newDateRange();
	dateRange.startDate = 'yesterday';
	dateRange.endDate = 'today';

	const request = AnalyticsData.newRunReportRequest();
	request.dimensions = dimensions;
	request.metrics = metrics;
	request.dateRanges = dateRange;
	request.dimensionFilter = filterExpression;
	request.limit = 250000;

	const report = AnalyticsData.Properties.runReport(request, `properties/${propertyId}`);
	const sheet = SpreadsheetApp.getActive().getSheetByName("Hourly(Previous Period)");
	sheet.getRange("A1:I").clear();

	if (!report.rows) return;

	const headers = [...report.dimensionHeaders.map(d => d.name), ...report.metricHeaders.map(m => m.name)];
	sheet.appendRow(headers);

	const rows = report.rows
		.filter(row => parseInt(row.dimensionValues[4]?.value || 0) <= (currentHour - 2))
		.map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);

	sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

	// Trigger post-processing
	insertAndProcessData(rows);
}

// ============================================
// 4. Data Aggregation & Comparison Logic
// ============================================

/**
 * This section transforms raw hourly GA4 event data into a structured, aggregated,
 * and comparable format, allowing automated detection of significant metric changes
 * between yesterday and today across multiple brands and events.
 *
 * It includes the following main functions:
 *
 * ----------------------------------------------------------------------
 * 1. insertAndProcessData(data):
 * ----------------------------------------------------------------------
 * - Input: Raw hourly GA4 data (output from runHourlyReport)
 * - Groups and aggregates the data by:
 *     • streamName (brand)
 *     • date
 *     • hour
 *     • dateHour
 * - For each hour and event type (e.g., Mod_NRC, page_view), it calculates:
 *     • totalUsers
 *     • sessions
 *     • eventCount
 * - Writes the aggregated metrics into the "Metrics Alerts" sheet
 * - Triggers the compareMetrics() function for further analysis
 *
 * ----------------------------------------------------------------------
 * 2. compareMetrics():
 * ----------------------------------------------------------------------
 * - Reads the hourly-aggregated data from the "Metrics Alerts" sheet
 * - Compares each hour of today against the same hour of yesterday
 * - Calculates percentage differences for each metric per event
 * - Output is written to the "Alerts Log" sheet in the following format:
 *     [Brand, Date1 (Today), Date2 (Yesterday), Hour, Metric, Value1, Value2, % Difference]
 * - Uses a utility function to handle edge cases (e.g., divide by 0)
 *
 * ----------------------------------------------------------------------
 * 3. sendAlerts():
 * ----------------------------------------------------------------------
 * - Scans the "Alerts Log" for anomalies in the data
 * - Triggers an alert when:
 *     • Drop ≥ 300%  → Significant decrease (i.e., numDiff ≤ -3)
 *     • Spike ≥ 500% → Significant increase (i.e., numDiff ≥ 5)
 * - Note: These thresholds are scaled by 100 for simplicity.
 *         For example:
 *          -3  means  -300%
 *          +5  means  +500%
 *         So we're using "hundred-based percentages" instead of decimal values.
 * - Only alerts on values where both v1 and v2 are ≥ 10, to avoid noise
 * - Writes flagged alerts to the "Alerts" sheet
 * - Applies conditional formatting to highlight increase (green) or decrease (red)
 * - (Optional) Sends an alert email with links to the dashboard and report
 *
 * ----------------------------------------------------------------------
 * Supporting Functions:
 * ----------------------------------------------------------------------
 * - getOrCreateSheet():
 *     Ensures the "Metrics Alerts" sheet exists before writing data
 * - applyConditionalFormatting():
 *     Visually highlights positive or negative changes in the "Alerts" sheet
 * - calculatePercentageDifference():
 *     Helper function to compute and format the % difference between two values
 */

function insertAndProcessData(data) {
	const eventNames = ["Mod_NRC", "Mod_NDC", "Mod_RDC", "Mod_Casino_Bet_Placed", "Mod_Sportsbook_Bet_Placed", "page_view"];
	const grouped = {};

	data.forEach(row => {
		const key = `${row[0]}|${row[3]}|${row[4]}|${row[5]}`;
		if (!grouped[key]) {
			grouped[key] = {
				brand: row[0],
				date: row[3],
				hour: row[4],
				dateHour: row[5]
			};
			eventNames.forEach(e => {
				grouped[key][`${e}_totalUsers`] = 0;
				grouped[key][`${e}_sessions`] = 0;
				grouped[key][`${e}_eventCount`] = 0;
			});
		}
		grouped[key][`${row[2]}_totalUsers`] += parseInt(row[6] || 0, 10);
		grouped[key][`${row[2]}_sessions`] += parseInt(row[7] || 0, 10);
		grouped[key][`${row[2]}_eventCount`] += parseInt(row[8] || 0, 10);
	});

	const sheet = getOrCreateSheet();
	sheet.clear();

	const headers = ["brand", "date", "hour", "dateHour"];
	eventNames.forEach(e => headers.push(`${e}_totalUsers`, `${e}_sessions`, `${e}_eventCount`));
	sheet.appendRow(headers);

	Object.values(grouped).forEach(row => {
		const rowData = headers.map(h => row[h] || 0);
		sheet.appendRow(rowData);
	});

	compareMetrics();
}

function compareMetrics() {
	const sheet = getOrCreateSheet();
	const data = sheet.getDataRange().getValues();
	const output = SpreadsheetApp.openById("1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q").getSheetByName("Alerts Log");
	output.clear();

	const headers = ['Brand', 'Date1 (Latest)', 'Date2 (Previous)', 'Hour', 'Metric', 'Date1 Value', 'Date2 Value', 'Percentage Difference'];
	const results = [headers];
	const grouped = {};

	data.slice(1).forEach(row => {
		const [brand, date, hour] = row;
		if (!grouped[brand]) grouped[brand] = {};
		if (!grouped[brand][date]) grouped[brand][date] = {};
		grouped[brand][date][hour] = {
			NRC_totalUsers: row[4],
			NRC_sessions: row[5],
			NRC_eventCount: row[6],
			NDC_totalUsers: row[7],
			NDC_sessions: row[8],
			NDC_eventCount: row[9],
			RDC_totalUsers: row[10],
			RDC_sessions: row[11],
			RDC_eventCount: row[12],
			Casino_Bet_Placed_totalUsers: row[13],
			Casino_Bet_Placed_sessions: row[14],
			Casino_Bet_Placed_eventCount: row[15],
			Sportsbook_Bet_Placed_totalUsers: row[16],
			Sportsbook_Bet_Placed_sessions: row[17],
			Sportsbook_Bet_Placed_eventCount: row[18],
			page_view_totalUsers: row[19],
			page_view_sessions: row[20],
			page_view_eventCount: row[21]
		};
	});

	for (const brand in grouped) {
		const dates = Object.keys(grouped[brand]).sort();
		for (let i = dates.length - 1; i > 0; i--) {
			const [date1, date2] = [dates[i], dates[i - 1]];
			for (let hour = 0; hour < 24; hour++) {
				const data1 = grouped[brand][date1][hour];
				const data2 = grouped[brand][date2][hour];
				if (!data1 || !data2) continue;

				for (const metric in data1) {
					const v1 = parseInt(data1[metric] || 0, 10);
					const v2 = parseInt(data2[metric] || 0, 10);
					const diff = calculatePercentageDifference(v1, v2);
					results.push([brand, date1, date2, hour, metric, v1, v2, diff]);
				}
			}
		}
	}

	output.getRange(1, 1, results.length, headers.length).setValues(results);
}

function calculatePercentageDifference(value1, value2) {
	if (value1 === 0 && value2 === 0) return '0%';
	if (value2 === 0) return '+100%';
	if (value1 === 0) return '-100%';
	return (((value1 - value2) / value2) * 100).toFixed(2) + '%';
}

function sendAlerts() {
	const resultSheet = SpreadsheetApp.openById("1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q").getSheetByName("Alerts Log");
	const alertSheet = SpreadsheetApp.openById("1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q").getSheetByName("Alerts");
	const data = resultSheet.getDataRange().getValues();
	alertSheet.clear();

	const headers = data[0];
	const alerts = [headers];

	data.slice(1).forEach(row => {
		const [brand, date1, date2, hour, metric, v1, v2, diff] = row;
		const numDiff = parseFloat((diff || '0').toString().replace('%', ''));
		const [val1, val2] = [parseInt(v1), parseInt(v2)];
		if ((numDiff <= -3 && val1 === 0 && val2 >= 10) || (numDiff <= -3 && val1 >= 10 && val2 >= 10) || (numDiff >= 5 && val1 >= 10 && val2 >= 10)) {
			alerts.push(row);
		}
	});

	if (alerts.length > 1) {
		alertSheet.getRange(1, 1, alerts.length, headers.length).setValues(alerts);
		applyConditionalFormatting(alertSheet);

		const htmlBody = `
      <p>Hi Team,</p>
      <p>Please review today's metric comparison:</p>
      <ul>
        <li><a href="https://docs.google.com/spreadsheets/d/1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q/edit?usp=sharing">Google Sheet Report</a></li>
        <li><a href="https://lookerstudio.google.com/reporting/c9c3c3c0-13e7-4680-9190-6724d202d018">Dashboard</a></li>
      </ul>
      <p>Regards,<br>Naren</p>
    `;
		// GmailApp.sendEmail("your@email.com", "Metrics Alert", "", { htmlBody }); // Uncomment to activate
	}
}

function getOrCreateSheet() {
	const ss = SpreadsheetApp.openById("1P12wpLsiN-y6kJERZD71K4cCMtzGEOJCnsj5hNtnM9Q");
	const sheetName = "Metrics Alerts";
	let sheet = ss.getSheetByName(sheetName);
	if (!sheet) sheet = ss.insertSheet(sheetName);
	return sheet;
}

function applyConditionalFormatting(sheet) {
	const range = sheet.getRange(2, 8, sheet.getLastRow() - 1, 1);
	range.clearFormat();

	const green = SpreadsheetApp.newConditionalFormatRule()
		.whenNumberGreaterThan(0).setBackground("#c6efce").setFontColor("#006100").setRanges([range]).build();
	const red = SpreadsheetApp.newConditionalFormatRule()
		.whenNumberLessThan(0).setBackground("#ffc7ce").setFontColor("#9c0006").setRanges([range]).build();

	sheet.setConditionalFormatRules([green, red]);
}
