
/**
 * ============================================
 * GA4 Realtime Monitoring Script with Comments
 * ============================================
 *
 * This script fetches real-time and hourly data from Google Analytics 4 (GA4)
 * using the Google Analytics Data API and writes it into Google Sheets.
 *
 * The following three functions are defined:
 * 1. runKPIsReport() - Pulls selected real-time event data (last 30 mins)
 * 2. runActiveUsersReport() - Pulls active user + page view data (last 30 mins)
 * 3. runHourlyReport() - Pulls hourly event data from yesterday and today
 *
 * Required Google Sheet Tabs:
 * - KPIs
 * - Active Users
 * - Hourly(Previous Period)
 *
 * API Used: Google Analytics Data API
 */


/**
 * ============================================
 * 1. Main KPIs Report (Realtime Events)
 * ============================================
 */
function runKPIsReport() {
  const propertyId = '335360279';

  // Define metric: Count of events
  const metric = AnalyticsData.newMetric();
  metric.name = 'eventCount';

  // Define dimensions for breakdown
  const dimension1 = AnalyticsData.newDimension(); dimension1.name = 'streamName';
  const dimension2 = AnalyticsData.newDimension(); dimension2.name = 'eventName';
  const dimension3 = AnalyticsData.newDimension(); dimension3.name = 'minutesAgo';
  const dimension4 = AnalyticsData.newDimension(); dimension4.name = 'country';

  // Define the 30-minute window (now - 30 minutes)
  const minuteRanges = AnalyticsData.newMinuteRange();
  minuteRanges.startMinutesAgo = 30;
  minuteRanges.endMinutesAgo = 0;

  // Create the realtime report request
  const request = AnalyticsData.newRunRealtimeReportRequest();
  request.dimensions = [dimension1, dimension2, dimension3, dimension4];
  request.metrics = [metric];
  request.minuteRanges = [minuteRanges];
  request.limit = 250000;

  const report = AnalyticsData.Properties.runRealtimeReport(request, 'properties/' + propertyId);

  // Clear old data
  SpreadsheetApp.getActive().getSheetByName("KPIs").getRange("A1:E").clear();

  // Extract and write headers
  const dimensionHeaders = report.dimensionHeaders.map(d => d.name);
  const metricHeaders = report.metricHeaders.map(m => m.name);
  const headers = [...dimensionHeaders, ...metricHeaders];
  SpreadsheetApp.getActive().getSheetByName("KPIs").appendRow(headers);

  // Filter by selected events and write rows
  const rows = report.rows
    .filter(row => {
      const eventName = row.dimensionValues[1]?.value;
      const selectedEvents = ["Mod_NRC", "Mod_NDC", "Mod_RDC", "Mod_Casino_Bet_Placed", "Mod_Sportsbook_Bet_Placed"];
      return selectedEvents.includes(eventName);
    })
    .map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);

  SpreadsheetApp.getActive().getSheetByName("KPIs").getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Call next report in chain
  runActiveUsersReport();
}


/**
 * ============================================
 * 2. Active Users Report (Realtime Metrics)
 * ============================================
 */
function runActiveUsersReport() {
  const propertyId = '335360279';

  // Metrics
  const metric = AnalyticsData.newMetric(); metric.name = 'activeUsers';
  const metric1 = AnalyticsData.newMetric(); metric1.name = 'screenPageViews';

  // Dimensions
  const dimension1 = AnalyticsData.newDimension(); dimension1.name = 'streamName';
  const dimension2 = AnalyticsData.newDimension(); dimension2.name = 'country';
  const dimension3 = AnalyticsData.newDimension(); dimension3.name = 'minutesAgo';
  const dimension4 = AnalyticsData.newDimension(); dimension4.name = 'deviceCategory';

  const minuteRanges = AnalyticsData.newMinuteRange();
  minuteRanges.startMinutesAgo = 30;
  minuteRanges.endMinutesAgo = 0;

  const request = AnalyticsData.newRunRealtimeReportRequest();
  request.dimensions = [dimension1, dimension2, dimension3, dimension4];
  request.metrics = [metric, metric1];
  request.minuteRanges = [minuteRanges];
  request.limit = 250000;

  const report = AnalyticsData.Properties.runRealtimeReport(request, 'properties/' + propertyId);

  // Clear and write results
  SpreadsheetApp.getActive().getSheetByName("Active Users").getRange("A1:F").clear();
  const dimensionHeaders = report.dimensionHeaders.map(d => d.name);
  const metricHeaders = report.metricHeaders.map(m => m.name);
  const headers = [...dimensionHeaders, ...metricHeaders];
  SpreadsheetApp.getActive().getSheetByName("Active Users").appendRow(headers);

  const rows = report.rows.map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);
  SpreadsheetApp.getActive().getSheetByName("Active Users").getRange(2, 1, rows.length, headers.length).setValues(rows);
}


/**
 * ============================================
 * 3. Hourly Report (Historical Event Trends)
 * ============================================
 */
function runHourlyReport() {
  const propertyId = '335360279';
  const now = new Date();
  const hour = Utilities.formatDate(now, 'Europe/Malta', 'HH');

  // Metrics
  const metric = AnalyticsData.newMetric(); metric.name = 'totalUsers';
  const metric1 = AnalyticsData.newMetric(); metric1.name = 'sessions';
  const metric2 = AnalyticsData.newMetric(); metric2.name = 'eventCount';

  // Dimensions
  const dimension = AnalyticsData.newDimension(); dimension.name = 'streamName';
  const dimension1 = AnalyticsData.newDimension(); dimension1.name = 'country';
  const dimension2 = AnalyticsData.newDimension(); dimension2.name = 'eventName';
  const dimension3 = AnalyticsData.newDimension(); dimension3.name = 'date';
  const dimension4 = AnalyticsData.newDimension(); dimension4.name = 'hour';
  const dimension5 = AnalyticsData.newDimension(); dimension5.name = 'dateHour';

  // Filter for specific events
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
  request.dimensions = [dimension, dimension1, dimension2, dimension3, dimension4, dimension5];
  request.metrics = [metric, metric1, metric2];
  request.dateRanges = dateRange;
  request.dimensionFilter = filterExpression;
  request.limit = 250000;
  request.offset = 0;

  const report = AnalyticsData.Properties.runReport(request, 'properties/' + propertyId);

  const sheet = SpreadsheetApp.getActive().getSheetByName("Hourly(Previous Period)");
  sheet.getRange("A1:I").clear();

  if (!report.rows) return;

  const dimensionHeaders = report.dimensionHeaders.map(d => d.name);
  const metricHeaders = report.metricHeaders.map(m => m.name);
  const headers = [...dimensionHeaders, ...metricHeaders];
  sheet.appendRow(headers);

  const rows = report.rows
    .filter(row => {
      const timestamp = row.dimensionValues[4]?.value;
      return parseInt(timestamp) <= (parseInt(hour) - 2);
    })
    .map(row => [...row.dimensionValues.map(d => d.value), ...row.metricValues.map(m => m.value)]);

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}
