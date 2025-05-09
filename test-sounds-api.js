// Simple script to test the sounds API endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sounds?limit=1',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE DATA:');
    try {
      // Try to parse the data as JSON
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      // If it's not valid JSON, just output the raw data
      console.log('Error parsing JSON:', e.message);
      console.log('Raw data:', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end(); 