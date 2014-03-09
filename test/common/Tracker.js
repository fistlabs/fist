'use strict';

var Tracker = require('../../Tracker');
var Track = require('../../track/Track');

module.exports = {

    'Tracker.prototype.resolve': function (test) {

        var tracker = new Tracker();
        var track = new Track(tracker);

        tracker.decl('_', function (data, done) {
            done(null, 'a');
        });

        tracker.decl('a_Ok', function (data, done) {
            test.ok(this instanceof Track);
            test.strictEqual(this, track);
            this.invoke('_', done);
        });

        tracker.decl('b_Ok', ['a_Ok'], function (data, done) {
            test.ok(this instanceof Track);
            test.strictEqual(this, track);
            test.deepEqual(data, {
                result: {
                    a_Ok: 'a'
                },
                errors: {}
            });
            done(null, {
                value: 'b'
            });
        });

        tracker.decl('c_Er', ['a_Ok', 'b_Ok'], function (data, done) {
            test.ok(this instanceof Track);
            test.strictEqual(this, track);
            test.deepEqual(data, {
                result: {
                    a_Ok: 'a',
                    b_Ok: {
                        value: 'b'
                    }
                },
                errors: {}
            });
            done('c');
        });

        tracker.decl('b_Ok.ns', function (data, done) {
            done(null, {
                a: 42,
                b: 54
            });
        });

        tracker.decl('d_Ok', ['b_Ok.ns',
        'b_Ok', 'c_Er', 'z_Er'], function (data, done) {

            test.ok(this instanceof Track);
            test.strictEqual(this, track);
            test.deepEqual(data, {
                result: {
                    b_Ok: {
                        value: 'b'
                    },
                    'b_Ok.ns': {
                        a: 42,
                        b:54
                    }
                },
                errors: {
                    c_Er: 'c',
                    z_Er: void 0
                }
            });
            done(null, 'd');
        });

        tracker.resolve(track, 'd_Ok', function (err, res) {
            test.ok(this instanceof Tracker);
            test.strictEqual(this, tracker);
            test.strictEqual(err, null);
            test.strictEqual(res, 'd');
            test.done();
        });
    }

};
