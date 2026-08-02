const https = require('https');

https.get('https://api.alquran.cloud/v1/surah/21', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data).data.ayahs[0].text));
});
