'use strict';

var Pathr = require('../../../route/Pathr');
Object.prototype.bug = 42;

module.exports = {

    'Pathr.prototype.build': [
        function (test) {
            var pathr = new Pathr('/a/(<page>/c/)');

            test.strictEqual(pathr.build({
                page: 5,
                text: 42
            }), '/a/5/c/?text=42');

            test.strictEqual(pathr.build(), '/a/');

            pathr = new Pathr('/(<competitionId>/)contest/' +
                              '<contestId>/<contestPage>/');

            test.strictEqual(pathr.build({
                competitionId: void 0,
                contestId: '59',
                contestPage: 'enter'
            }), '/contest/59/enter/');

            test.done();
        }
    ]
};
