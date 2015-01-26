/*eslint max-nested-callbacks: 0, no-proto: 0*/
/*global describe, it*/

'use strict';

var assert = require('assert');

describe('core/utils/runtime-finish-wait', function () {
    var RuntimeFinishWait = require('../core/utils/runtime-finish-wait');

    describe('new RuntimeFinishWait()', function () {

        it('Should initialize with empty "pending" array and "runtime" with null value', function () {
            var wait = new RuntimeFinishWait();

            assert.ok(Array.isArray(wait.pending));
            assert.strictEqual(wait.pending.length, 0);
            assert.strictEqual(wait.runtime, null);
        });
    });

    describe('wait.wait()', function () {

        it('Should return false if called first time', function () {
            var wait = new RuntimeFinishWait();

            assert.ok(!wait.wait({}));
            assert.ok(wait.wait({}));
            assert.ok(wait.wait({}));
            assert.ok(wait.wait({}));
        });

        it('Should increase "pending" length', function () {
            var wait = new RuntimeFinishWait();

            wait.wait({});
            assert.strictEqual(wait.pending.length, 1);
            wait.wait({});
            assert.strictEqual(wait.pending.length, 2);
            wait.wait({});
            assert.strictEqual(wait.pending.length, 3);
        });

        it('Should not more increase "pending" length if "runtime" is initialized', function () {
            var wait = new RuntimeFinishWait();

            wait.wait({});
            assert.strictEqual(wait.pending.length, 1);
            wait.wait({});
            wait.runtime = {
                done: function () {},
                parent: {}
            };
            assert.strictEqual(wait.pending.length, 2);
            wait.wait({
                done: function () {},
                parent: {}
            });
            assert.strictEqual(wait.pending.length, 2);
        });
    });

    describe('wait.doneRuntime()', function () {

        it('Should call runtime passed in existing context', function () {
            var wait = new RuntimeFinishWait();
            var existingRuntime = wait.runtime = {};
            var parent = {};
            var spy = 0;
            var runtime = {
                done: function () {
                    assert.strictEqual(this, existingRuntime);
                    assert.strictEqual(this.parent, parent);
                    spy += 1;
                },
                parent: parent
            };

            wait.doneRuntime(runtime);
            assert.strictEqual(spy, 1);
        });
    });

    describe('wait.emitDone()', function () {
        it('Should emit all pendings done', function () {
            var wait = new RuntimeFinishWait();
            var doneRuntime = {};
            var spy = [];

            wait.wait({
                done: function () {
                    assert.strictEqual(this, doneRuntime);
                    spy.push(this.parent);
                },
                parent: 1
            });

            wait.wait({
                done: function () {
                    assert.strictEqual(this, doneRuntime);
                    spy.push(this.parent);
                },
                parent: 2
            });

            wait.wait({
                done: function () {
                    assert.strictEqual(this, doneRuntime);
                    spy.push(this.parent);
                },
                parent: 3
            });

            wait.emitDone(doneRuntime);
            assert.deepEqual(spy, [1, 2, 3]);
            assert.strictEqual(wait.runtime, doneRuntime);
        });
    });
});
