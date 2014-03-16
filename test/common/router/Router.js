'use strict';

Object.prototype.bug = 42;

var Router = require('../../../router/Router');

module.exports = {

    'Router.prototype.find': [
        function (test) {

            var router = new Router();
            var contestStandings = router.
                addRoute('/contest/<contestId>/standings/');
            var contestSubmits = router.
                addRoute('/contest/<contestId>/submits/');

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

            router = new Router({
                nocase: true
            });

            router.addRoute('/static/', {
                noend: true
            });

            test.deepEqual(router.find('/STATIC/js/index.js').match, {});

            test.done();
        }
    ]
};
