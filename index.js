var crypto = require('crypto');
var readFile = promisify(require('fs'), 'readFile');

exports.cache = Object.create(null);

module.exports = function(redis, path, keys, args) {
  var doEval = promisifify(redis, 'eval');
  var doEvalsha = promisify(redis, 'evalsha');
  keys = keys || [];
  if (path in exports.cache) {
    return cacheFirst(path, keys, args, doEval, doEvalsha);
  } else {
    return fileFirst(path, keys, args, doEval, doEvalsha);
  }
};

function promisify(obj, name) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function(resolve, reject) {
      args.push(function(err, value) {
        return err ? reject(err) : resolve(value);
      });
      return obj[name].apply(obj, args);
    });
  }
}

function cacheFirst(path, keys, args, doEval, doEvalsha) {
  return doEvalsha(exports.cache[path], keys.length, keys, args).catch(function(err) {
    if (/^NOSCRIPT/.test(err.message)) {
      return readFile(path).then(function(script) {
        return doEval(script, keys.length, keys, args);
      });
    } else {
      throw err;
    }
  });
}

function fileFirst(path, keys, args, doEval, doEvalsha) {
  return readFile(path).then(function(script) {
    var sha = crypto.createHash('sha1').update(script).digest('hex');
    exports.cache[path] = sha;
    return doEvalsha(sha, keys.length, keys, args).catch(function(err) {
      if (/^NOSCRIPT/.test(err.message)) {
        return doEval(script, keys.length, keys, args);
      } else {
        throw err;
      }
    });
  });
}
