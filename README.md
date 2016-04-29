This library provides a wrapper for sending commands to a redis server using EVALSHA.

I wrote this because I was unsatisfied with the API and/or logic of the npm modules currently available (either they didn't return a promise, required the `new` keyword, or weren't very well tested).

## Quickstart

var evalsha = require('evalsha');
var redis = require('redis').createClient();

evalsha(redis, absolutePathToScript, keys, args); // => returns a promise
