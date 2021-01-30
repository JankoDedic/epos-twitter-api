const fs = require('fs');
const decode = require('html-entities').decode;
const chalk = require('chalk');
require('dotenv').config();
const TwitterAccount = require('./TwitterAccount');

const args = process.argv.slice(2);

function printUsers(users) {
  users.forEach(user => console.log(chalk.bgRed('@' + user.screen_name)));
}

function printTweets(tweets) {
  tweets.forEach((tweet, index) => {
    console.log(`[${index}] ` + chalk.bgRed(`@${tweet.user.screen_name}`));
    console.log(chalk.bold(decode(tweet.text)));
    console.log();
  });
}

function saveTweets(tweets) {
  fs.writeFileSync('tweets.json', JSON.stringify(tweets));
}

function tweetId(index) {
  return JSON.parse(fs.readFileSync('tweets.json'))[index].id_str;
}

(async function () {
  const account = new TwitterAccount(process.env.TWITTER_API_KEY, process.env.TWITTER_API_SECRET);

  let response;
  switch (args[0]) {
    case 'login':
      await account.login();
      break;
    case 'home':
      response = await account.request('GET', '/1.1/statuses/home_timeline.json');
      printTweets(response);
      saveTweets(response);
      break;
    case 'timeline':
      response = await account.request('GET', `/1.1/statuses/user_timeline.json?screen_name=${args[1]}&count=5`);
      printTweets(response);
      saveTweets(response);
      break;
    case 'mentions':
      response = await account.request('GET', '/1.1/statuses/mentions_timeline.json?count=5');
      printTweets(response);
      saveTweets(response);
      break;
    case 'tweet':
      response = await account.request('POST', `/1.1/statuses/update.json?status=${encodeURIComponent(args[1])}`);
      break;
    case 'delete':
      response = await account.request('POST', `/1.1/statuses/destroy/${tweetId(args[1])}.json`);
      break;
    case 'retweet':
      response = await account.request('POST', `/1.1/statuses/retweet/${tweetId(args[1])}.json`);
      break;
    case 'unretweet':
      response = await account.request('POST', `/1.1/statuses/unretweet/${tweetId(args[1])}.json`);
      break;
    case 'retweets':
      response = await account.request('GET', `/1.1/statuses/retweets/${tweetId(args[1])}.json?count=5`);
      printTweets(response);
      saveTweets(response);
      break;
    case 'fav':
      response = await account.request('POST', `/1.1/favorites/create.json?id=${tweetId(args[1])}`);
      break;
    case 'unfav':
      response = await account.request('POST', `/1.1/favorites/destroy.json?id=${tweetId(args[1])}`);
      break;
    case 'favlist':
      response = await account.request('GET', `/1.1/favorites/list.json?screen_name=${args[1]}&count=5`);
      printTweets(response);
      saveTweets(response);
      break;
    case 'follow':
      response = await account.request('POST', `/1.1/friendships/create.json?screen_name=${args[1]}`);
      break;
    case 'unfollow':
      response = await account.request('POST', `/1.1/friendships/destroy.json?screen_name=${args[1]}`);
      break;
    case 'followers':
      response = await account.request('GET', `/1.1/followers/list.json?screen_name=${args[1]}&count=10`);
      printUsers(response.users);
      break;
    case 'following':
      response = await account.request('GET', `/1.1/friends/list.json?screen_name=${args[1]}&count=20`);
      printUsers(response.users);
      break;
    case 'search':
      response = await account.request('GET', `/1.1/search/tweets.json?q=${encodeURIComponent(args[1])}`);
      printTweets(response.statuses);
      break;
    default:
      console.log('Unknown command!');
      break;
  }

  process.exit(0);
})();
