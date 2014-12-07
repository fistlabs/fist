/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var Agent = require('../core/core');
var Server = require('../core/server');
var Track = require('../core/track');
var Rule = require('finger/core/rule');
var assert = require('assert');

function getAgent(params) {
    var agent = new Agent(params);
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit_asker'));
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit_serial'));
    agent.install(require.resolve('../fist_plugins/units/_fist_contrib_unit'));
    return agent;
}

describe('fist_plugins/units/_fist_contrib_unit_asker', function () {
    var back = new Server({
        name: 'BACKEND'
    });

    back.route('/api/<type>/', {
        name: 'api',
        unit: 'api'
    });

    back.route('POST /upload/', {
        name: 'upload',
        unit: 'upload'
    });

    back.unit({
        name: 'api',
        main: function (track, context) {
            track.send(context.params);
        }
    });

    back.unit({
        name: 'upload',
        main: function (track, context) {
            track.send(context.params);
        }
    });

    this.beforeAll(function () {
        back = back.listen(12345);
    });

    this.afterAll(function () {
        back.close();
    });

    it('Should do request', function (done) {
        var agent = getAgent({
            name: 'FRONTEND'
        });
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_asker',
            name: 'docs',
            options: function (track, context) {
                return {
                    timeout: 10000,
                    port: 12345,
                    hostname: 'localhost',
                    path: new Rule('/api/<type>/'),
                    vars: {
                        type: context.param('type')
                    }
                };
            }
        });

        agent.ready().done(function () {
            track.eject('docs', {
                toString: function () {
                    return this.type;
                },
                type: 'index'
            }).done(function (res) {
                assert.deepEqual(res, {
                    type: 'index'
                });
                done();
            });
        });
    });

    it('Should post data', function (done) {
        var agent = getAgent({
            name: 'FRONTEND'
        });
        var track = new Track(agent);

        agent.unit({
            base: '_fist_contrib_unit_asker',
            name: 'upload',
            options: function (track, context) {
                return {
                    timeout: 10000,
                    port: 12345,
                    method: 'POST',
                    protocol: 'http:',
                    hostname: 'localhost',
                    body: 'foo',
                    path: '/upload/',
                    query: context.params
                };
            }
        });

        agent.ready().done(function () {
            track.eject('upload', {
                foo: 'bar',
                toString: function () {
                    return JSON.stringify(this);
                }
            }).done(function (res) {
                assert.strictEqual(res.foo, 'bar');
                done();
            });
        });
    });
});
