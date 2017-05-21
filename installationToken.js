const fs = require('fs');
const jwt = require('jsonwebtoken');
const requestp = require('./requestAsPromise');
const integrationId = 2429;

const cert = fs.readFileSync('gifbot-private-key.pem');
const token = jwt.sign({ iss: integrationId },
  cert, {
    algorithm: 'RS256',
    expiresIn: '10m'
  });

module.exports = (installationId) => requestp({
  url: `https://api.github.com/installations/${installationId}/access_tokens`,
  json: true,
  headers: {
    'Authorization': 'Bearer ' + token,
    'User-Agent': 'ColinEberhardt',
    'Accept': 'application/vnd.github.machine-man-preview+json'
  },
  method: 'POST'
})
.then(({token}) => token);
