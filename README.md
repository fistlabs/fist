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

* [Базовые понятия](#%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B5-%D0%BF%D0%BE%D0%BD%D1%8F%D1%82%D0%B8%D1%8F)
* [Расширение](#%D0%A0%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5)
* [Ссылки](#%D0%A1%D1%81%D1%8B%D0%BB%D0%BA%D0%B8)

#Базовые понятия
#Расширение
#Ссылки
