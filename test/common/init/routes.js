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
                }
            ]
        });

        fist.schedule(routes);

        fist.on('sys:ready', function () {
            test.strictEqual(fist.router.routes.length, 1);
            test.done();
        });

        fist.ready();
    }
];
