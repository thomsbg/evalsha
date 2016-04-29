var test = require('tape');
var redis = require('fakeredis').createClient();
var sinon = require('sinon');
var evalsha = require('./index');

function flushdb() {
  return redis.flushdb();
}

test('it works if the script is already loaded', sinon.test(function(t) {
  var spy = this.spy(fs, 'readFile');
  t.plan(3);
  flushdb();
  redis.script('load', 'return true\n');
  var ret = evalsha(redis, path);
  t.equal(ret instanceof Promise, true);
  ret.then(function(val) {
    t.equal(val, true);
    t.equal(spy.called, false);
    spy.restore();
    t.end();
  });
}));

test('it works if redis returns a NOSCRIPT error', function(t) {
  t.plan(2);
  flushdb();
  var ret = evalsha(redis, path);
  t.equal(ret instanceof Promise, true);
  ret.then(function(val) {
    t.equal(val, true);
    t.end();
  });
});

test('it caches the sha of a file once it has been read', function(t) {
  t.plan(2);
  flushdb();
  var ret = evalsha(redis, path);
  t.equal(ret instanceof Promise, true);
  ret.then(function(val) {
    t.equal(val, true);
    t.end();
  });
});
