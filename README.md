fist.app [![Build Status](https://travis-ci.org/fistlabs/fist.app.png?branch=v0.0.x)](https://travis-ci.org/fistlabs/fist.app)
=========

Manual usage (not recommended)
---------

```js
var Fist = require('fist.app/Fist');
var fist = new Fist();

//  actions declaration
fist.decl('users', function (track, result, done) {
  done(null, ['pete', 'abraham']);
});

fist.decl('index', ['users'], function (track, result) {

  var users = result.users.map(function (name) {
      return '<li>' + name + '</li>';
  }).join('');
  track.header('Content-Type', 'text/html');
  track.send(200, '<ul>' + users + '</ul>');
});

//  binding routes to actions
fist.route('GET', '/', 'index');

//  listen to port
fist.listen(1337);

```
