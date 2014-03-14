'use strict';

var Toobusy = require('../../../util/Toobusy');
var block = require('../../util/block');

module.exports = [
    function (test) {

        var t = new Toobusy({
            maxLag: 1
        });

        block();

        setTimeout(function () {
            test.ok(t.busy());
            test.done();
        }, Toobusy.CHECK_INTERVAL + 10);
    }
];
