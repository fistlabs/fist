'use strict';

Object.prototype.bug = 42;

var Router = require('../../../router/Router');

var router = new Router();
var contestStandings = router.addRoute('/contest/<contestId>/standings/');
var contestSubmits = router.addRoute('/contest/<contestId>/submits/');

module.exports = {

    find: function (test) {

        test.deepEqual(router.find('/contest/60/standings/'), {
            route: contestStandings,
            match: {
                contestId: '60'
            }
        });

        test.deepEqual(router.find('/contest/192/submits/'), {
            route: contestSubmits,
            match: {
                contestId: '192'
            }
        });

        test.strictEqual(router.find('/CONTEST/20/submits/'), null);

        test.done();
    },

    options: function (test) {

        var r = new Router({
            nocase: true
        });

        r.addRoute('/static/', {
            noend: true
        });

        test.deepEqual(r.find('/STATIC/js/index.js').match, {});

        test.done();
    }

};
