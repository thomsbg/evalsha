var crypto = require('crypto');
var readFile = require('bluebird').promisify(require('fs').readFile);
var cache = Object.create(null);

module.exports = function(redis, path, keys, args) {
  return new Promise(function(resolve, reject) {
    if (path in cache) {
      evalThenLoad(path, keys, args).then(resolve, reject);
    } else {
      loadThenEval(path, keys, args).then(resolve, reject);
    }
  });
};

function evalThenLoad(path, keys, args) {
  var sha = cache[path];
  return redis.evalshaAsync(sha, keys.length, keys, args).catch(function(err) {
    if (/^NOSCRIPT/.test(err.message)) {
      return readFile(path).then(function(script) {
        return redis.evalAsync(script, keys.length, keys, args);
      });
    } else {
      throw err;
    }
  })
}

function loadThenEval(path, keys, args) {
  return readFile(path).then(function(script) {
    var sha = crypto.createHash('sha1').update(script).digest('hex');
    cache[path] = sha;
    return redis.evalshaAsync(sha, keys.length, keys, args).catch(function(err) {
      if (/^NOSCRIPT/.test(err.message)) {
        return redis.evalAsync(script, keys.length, keys, args);
      } else {
        throw err;
      }
    });
  });
}
