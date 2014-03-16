'use strict';

var Framework = require('../../../Framework');
var routes = require('../../../init/routes');

module.exports = [
    function (test) {

        var fist = new Framework({
            routes: [
                {
                    verb: 'GET',
                    expr: '/',
                    name: 'index'
                },
                {
                    expr: '/',
                    name: 'index2'
                }
            ]
        });

        fist.schedule(routes);

        fist.on('sys:ready', function () {
            test.strictEqual(fist.router.routes.length, 2);
            test.strictEqual(fist.router.routes[1].verb, 'GET');
            test.done();
        });

        fist.ready();
    }
];
