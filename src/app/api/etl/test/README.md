# ETL Integration Test Suite

This API endpoint and associated test suite provides a way to verify the core ETL functionality of the Trendzo system.

## What's Tested

1. **Apify TikTok Scraper**: Validates that the Apify integration can successfully fetch TikTok data and parse it correctly.
2. **Extended Firestore Fields**: Confirms that all required fields are properly populated in Firestore when storing templates.
3. **ETL Error Handling & Logging**: Tests the error handling mechanisms and logging system to ensure errors are properly captured.
4. **Scheduled Job Alerts**: Verifies that the scheduler can trigger alerts when jobs fail.

## Running the Tests

### Via API

You can run the tests by making a POST request to this API endpoint:

```bash
curl -X POST https://your-domain.com/api/etl/test \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_ADMIN_API_KEY" \
  -d '{"cleanupAfter": true, "testAlerts": false}'
```

### Using the Test Script

For convenience, a test script is provided:

```bash
# Run basic tests
node scripts/test-etl.js

# Run tests with data cleanup after completion
node scripts/test-etl.js --cleanup

# Run all tests including alert system tests
node scripts/test-etl.js --cleanup --test-alerts
```

## Test Options

- `cleanupAfter`: Boolean (default: false) - Whether to delete test data after tests complete
- `testAlerts`: Boolean (default: false) - Whether to test the alert system

## Required Environment Variables

The tests require the following environment variables to be set:

```
# API keys
ADMIN_API_KEY=your-admin-api-key
ETL_API_KEY=your-etl-api-key
APIFY_API_TOKEN=your-apify-token

# For alert testing
ETL_ALERT_EMAIL_ENABLED=true
ETL_ALERT_EMAIL_FROM=alerts@yourdomain.com
ETL_ALERT_EMAIL_TO=admin@yourdomain.com
ETL_ALERT_SMTP_HOST=smtp.yourdomain.com
ETL_ALERT_SMTP_PORT=587
ETL_ALERT_SMTP_USER=smtp-user
ETL_ALERT_SMTP_PASS=smtp-password
```

## Testing in Development

When running locally, the API endpoint will automatically detect test mode and use mock data where appropriate to avoid hitting production services.

## Interpreting Results

The API returns a JSON object with the following structure:

```json
{
  "success": true|false,
  "message": "ETL integration tests completed successfully",
  "startTime": "2023-05-01T12:00:00.000Z",
  "endTime": "2023-05-01T12:01:00.000Z",
  "tests": {
    "apifyScraper": {
      "status": "passed|failed|skipped",
      "details": { ... }
    },
    "firestoreFields": { ... },
    "etlErrorHandling": { ... },
    "scheduledJobAlerts": { ... }
  }
}
```

Each test can have one of the following statuses:
- `passed`: The test completed successfully
- `failed`: The test failed (check the error field for details)
- `warning`: The test passed but with some concerns
- `skipped`: The test was skipped (usually due to configuration or by request)

## Manual Testing Steps

If you need to manually verify each component:

1. **Apify Scraper**:
   - Check the Apify console to see if runs are being created
   - Verify the data structure matches what's expected

2. **Firestore Fields**:
   - Examine the trendingTemplates collection in Firestore
   - Ensure all required fields are present and properly populated

3. **Error Handling**:
   - Check the etlLogs collection in Firestore
   - Verify that failed jobs are properly recorded with error details

4. **Scheduled Jobs**:
   - Monitor the email account specified in ETL_ALERT_EMAIL_TO
   - Ensure alerts are triggered when jobs fail repeatedly 