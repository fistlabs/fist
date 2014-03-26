fist [![Build Status](https://travis-ci.org/fistlabs/fist.png?branch=rc-dev)](https://travis-ci.org/fistlabs/fist)
=========

Fist - это nodejs-фреймворк для написания серверных приложений. Fist предлагает архитектуру, поддержка которой одинаково проста как для простых так и сложных web-серверов.

```js

var Fist = require('fist/Framework');
var fist = new Fist();

fist.decl('startTime', new Date());

fist.decl('index', ['startTime'], function (track, errors, result) {
    var uptime = new Date() - result.startTime;
    track.send(200, '<div>Server uptime: ' + uptime + 'ms</div>');
});

fist.route('GET', '/', 'index');

fist.listen(1337);

```
