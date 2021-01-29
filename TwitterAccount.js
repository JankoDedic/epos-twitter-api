const got = require('got');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function input(prompt) {
  return new Promise(async (resolve, reject) => {
    readline.question(prompt, (out) => {
      readline.close();
      resolve(out);
    });
  });
}

async function requestToken(oauth) {
  const authHeader = oauth.toHeader(oauth.authorize({
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST'
  }));

  const req = await got.post('https://api.twitter.com/oauth/request_token', {
    json: {
      'oauth_callback': 'oob'
    },
    headers: {
      Authorization: authHeader['Authorization']
    }
  });

  if (!req.body) {
    throw new Error('Cannot get an OAuth request token!');
  }

  return qs.parse(req.body);
}

async function accessToken(oauth, token, verifier) {
  const authHeader = oauth.toHeader(oauth.authorize({
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST'
  }));

  const req = await got.post(`https://api.twitter.com/oauth/access_token?oauth_verifier=${verifier}&oauth_token=${token.oauth_token}`, {
    headers: {
      Authorization: authHeader["Authorization"]
    }
  });

  if (!req.body) {
    throw new Error('Cannot get an OAuth access token!');
  }

  return qs.parse(req.body);
}

class TwitterAccount {
  constructor(key, secret) {
    this.oauth = OAuth({
      consumer: { key, secret },
      signature_method: 'HMAC-SHA1',
      hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
    });

    try {
      this.oAuthAccessToken = JSON.parse(fs.readFileSync('oauth.json'));
    } catch (e) {
      this.oAuthAccessToken = undefined;
    }
  }

  async login() {
    const oAuthRequestToken = await requestToken(this.oauth);

    const authorizationURL = new URL('https://api.twitter.com/oauth/authorize');
    authorizationURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
    console.log('Please go here and authorize:', authorizationURL.href);
    const pin = await input('Paste the PIN here: ');

    this.oAuthAccessToken = await accessToken(this.oauth, oAuthRequestToken, pin.trim());

    fs.writeFileSync('oauth.json', JSON.stringify(this.oAuthAccessToken));
  }

  async request(method, query) {
    if (!this.oAuthAccessToken) {
      console.error('You are not logged in!');
      process.exit(1);
    }

    const endpointURL = 'https://api.twitter.com' + query;
    const authHeader = this.oauth.toHeader(this.oauth.authorize({
      url: endpointURL,
      method: method
    }, {
      key: this.oAuthAccessToken.oauth_token,
      secret: this.oAuthAccessToken.oauth_token_secret
    }));

    const response = await got(endpointURL, {
      headers: {
        Authorization: authHeader['Authorization']
      },
      method: method
    });

    if (!response.body) {
      throw new Error('Unsuccessful request!');
    }

    return JSON.parse(response.body);
  }
}

module.exports = TwitterAccount;
