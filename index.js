const requestp = require('./requestAsPromise');
const installationToken = require('./installationToken');

const addComment = (url, body, token) =>
  requestp({
    json: true,
    headers: {
      'Authorization': 'token ' + token,
      'User-Agent': 'ColinEberhardt',
      'Accept': 'application/vnd.github.machine-man-preview+json'
    },
    method: 'POST',
    url,
    body: {
      body
    }
  });

const searchGifs = (searchTerm) =>
  requestp({
    url: 'http://api.giphy.com/v1/gifs/search',
    json: true,
    qs: {
      q: searchTerm,
      api_key: 'dc6zaTOxFJmzC'
    }
  });

const regex = /\[gifbot:(.*?)\]/g;

const createGifComment = (searchTerm, gifUrl) => `
![animated gif of ${searchTerm}](${gifUrl})
Powered By Giphy and served up by your ever faithful [gifbot](https://github.com/ColinEberhardt/gifbot)
`;

const noGifComment = (searchTerm) =>
  `Your faithful @gifbot is sorry to report that it couldn't find a gif for '${searchTerm}'`;

const getCommentBody = (webhook) => {
  if (webhook.comment) {
    return webhook.comment.body;
  } else if (webhook.issue) {
    return webhook.issue.body;
  } else if (webhook.pull_request) {
    return webhook.pull_request.body;
  }
  return '';
};

const validAction = (action) =>
  ['opened', 'created'].indexOf(action) !== -1;

exports.handler = ({ body }, lambdaContext, callback) => {
  const loggingCallback = (err, message) => {
    console.log('callback', err, message);
    callback(err, message);
  };

  if (!validAction(body.action)) {
    loggingCallback(null, {'message': 'ignored action of type ' + body.action});
    return;
  }

  const issueOrPull = body.issue ? body.issue : body.pull_request;

  console.log(`Looking for gifbot tokens in comment ${issueOrPull.url}`);

  const matches = regex.exec(getCommentBody(body));
  if (!matches) {
    loggingCallback(null, `The comment didn't summon the almighty gifbot`);
    return;
  }

  const searchTerm = matches[1];
  searchGifs(searchTerm)
    .then((results) => {
      let comment = noGifComment(searchTerm);
      if (results.data.length) {
        const gifUrl = results.data[0].images.fixed_height.url;
        comment = createGifComment(searchTerm, gifUrl);
      }
      return installationToken(body.installation.id)
       .then((token) => addComment(issueOrPull.comments_url, comment, token));
    })
    .then(() => loggingCallback(null, 'added comment'))
    .catch((err) => {
      loggingCallback(err.toString());
    });
};
