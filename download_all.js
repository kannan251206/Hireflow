const fs = require('fs');
const https = require('https');
const path = require('path');
const url = require('url');

const files = {
  'index.html': '1MmiLynT-vGmBmX8pYrfyGND0CKQDfyex',
  'package.json': '1MQtVrBolsM4HBri1An9RKRx7FYJKh9nU',
  'script.js': '1xnl1CQC5_qD2OqVZ-DEqLr5bNSuF7WCb',
  'style.css': '1TEZINJoFm7pkI5EoFF6XVxQvPjnOOgJA',
  'tpl-bold.png': '1q9ySbEqsNm7fHU1g2i2szAWN9k6XtPPJ',
  'tpl-clean.png': '1i-Y4SPHHZ5I1wbmt7LTWnVPIDfD5CfaF',
  'tpl-executive.png': '1B5i5_igD4wAdb4Rq7sEGdALEAT3weDop',
  'tpl-soft.png': '141KMP9dobGSLyfvqk1wtK1lQSK9V7C10'
};

const outputDir = path.join(__dirname, 'downloaded_module');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function downloadFile(fileId, filename, attempts = 0) {
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const outputPath = path.join(outputDir, filename);
  
  console.log(`Starting download for ${filename} (ID: ${fileId})`);
  
  const makeRequest = (targetUrl) => {
    const parsedUrl = url.parse(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`[Redirect] ${filename} status ${res.statusCode} -> ${res.headers.location}`);
        makeRequest(res.headers.location);
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`[Error] ${filename} failed with status: ${res.statusCode}`);
        return;
      }

      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        let html = '';
        res.on('data', (chunk) => html += chunk);
        res.on('end', () => {
          // Parse all hidden form inputs
          const inputRegex = /<input type="hidden" name="([^"]+)" value="([^"]+)"/ig;
          let inputMatch;
          const queryParams = [];
          while ((inputMatch = inputRegex.exec(html)) !== null) {
            queryParams.push(`${inputMatch[1]}=${encodeURIComponent(inputMatch[2])}`);
          }

          if (queryParams.length > 0) {
            const confirmUrl = `https://drive.usercontent.google.com/download?${queryParams.join('&')}`;
            console.log(`[Confirm] Downloading warning confirmation for ${filename}: ${confirmUrl}`);
            makeRequest(confirmUrl);
          } else {
            console.error(`[Error] Expected file content for ${filename} but got HTML response without form parameters.`);
            fs.writeFileSync(path.join(outputDir, `${filename}_error.html`), html);
          }
        });
      } else {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`[Success] Downloaded ${filename}`);
        });
      }
    }).on('error', (err) => {
      console.error(`[Error] Request failed for ${filename}:`, err);
    });
  };

  makeRequest(downloadUrl);
}

Object.keys(files).forEach((filename) => {
  downloadFile(files[filename], filename);
});
