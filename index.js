const TwitterAccount = require('./TwitterAccount');

require('dotenv').config();

const args = process.argv.slice(2);

(async function () {
  const account = new TwitterAccount(process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET);

  var response;
  switch (args[0]) {
    case 'login':
      await account.login();
      break;
    case 'home':
      response = await account.request('GET', '/1.1/statuses/home_timeline.json');
      console.log(response.map(tweet => tweet.text));
      break;
    case 'timeline':
      response = await account.request('GET', `/1.1/statuses/user_timeline.json?screen_name=${args[1]}&count=5`)
      console.log(response.map(tweet => tweet.text));
      break;
    default:
      console.log('Unknown command!');
      break;
  }

  process.exit(0);
})();
