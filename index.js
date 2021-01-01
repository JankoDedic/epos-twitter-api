const TwitterAccount = require('./TwitterAccount');

require('dotenv').config();

(async function () {
  const account = new TwitterAccount();
  await account.login(process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET);

  const response = await account.request('GET', '/2/tweets?ids=1344362530014158850&tweet.fields=lang,author_id&user.fields=created_at');
  console.log(response);

  process.exit(0);
})();
