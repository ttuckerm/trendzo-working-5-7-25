function onOpen() {
  SpreadsheetApp.getUi().createMenu('Trendzo')
    .addItem('Setup', 'TZ_SetupPrompt')
    .addItem('Pull Leaderboard (7d)', 'TZ_PullLeaderboard7d')
    .addItem('Push Conversions Test', 'TZ_PushConversionsTest')
    .addToUi();
}

function TZ_SetupPrompt() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = ui.prompt('Enter API Key (X-API-Key)').getResponseText();
  var baseUrl = ui.prompt('Enter Base URL (e.g., https://yourdomain.com)').getResponseText();
  TZ_Setup(apiKey, baseUrl);
}

function TZ_Setup(apiKey, baseUrl) {
  PropertiesService.getScriptProperties().setProperty('TZ_API_KEY', apiKey);
  PropertiesService.getScriptProperties().setProperty('TZ_BASE_URL', baseUrl);
}

function TZ_PullLeaderboard(window) {
  var win = window || '7d';
  var apiKey = PropertiesService.getScriptProperties().getProperty('TZ_API_KEY');
  var baseUrl = PropertiesService.getScriptProperties().getProperty('TZ_BASE_URL');
  var url = baseUrl + '/api/templates/leaderboard?window=' + encodeURIComponent(win);
  var resp = UrlFetchApp.fetch(url, { method: 'get', headers: { 'X-API-Key': apiKey } });
  var json = JSON.parse(resp.getContentText());
  var sheet = SpreadsheetApp.getActive().getSheetByName('Leaderboard') || SpreadsheetApp.getActive().insertSheet('Leaderboard');
  sheet.clear();
  sheet.appendRow(['template_id','title','metric_value','rank']);
  for (var i=0;i<json.length;i++) {
    var r = json[i];
    sheet.appendRow([r.template_id, r.title, r.metric_value, r.rank]);
  }
}

function TZ_PullLeaderboard7d() { TZ_PullLeaderboard('7d'); }

function TZ_PushConversionsTest() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('TZ_API_KEY');
  var baseUrl = PropertiesService.getScriptProperties().getProperty('TZ_BASE_URL');
  var url = baseUrl + '/api/pixel/collect';
  var payload = { type: 'purchase', template_id: 'tpl_sheet', value_cents: 1999, utm_source: 'sheets', utm_medium: 'test', utm_campaign: 'onboarding', referral_code: 'DEMO10' };
  var resp = UrlFetchApp.fetch(url, { method: 'post', headers: { 'Content-Type':'application/json', 'X-API-Key': apiKey }, payload: JSON.stringify(payload) });
  Logger.log(resp.getContentText());
}



