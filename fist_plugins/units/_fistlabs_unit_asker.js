'use strict';

var bodyEncoders = require('asker').bodyEncoders;
var hasProperty = Object.prototype.hasOwnProperty;
var vowAsker = require('vow-asker');
var url = require('fast-url-parser');

module.exports = function (agent) {

    /**
     * @class _fist_contrib_unit_asker
     * @extends _fist_contrib_unit_serial
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @property
         * @type {String}
         * */
        base: '_fistlabs_unit_serial',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @property
         * @type {String}
         * */
        name: '_fistlabs_unit_asker',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @property
         * @type {Array<String>}
         * */
        series: [
            'options',
            'prepare',
            'request',
            'compile',
            'resolve'
        ],

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        options: function (track) {
            /*eslint no-unused-vars: 0*/
            return {};
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        prepare: function (track) {
            var opts = Object(track.prev);
            var path = opts.path;

            if (path && typeof path.build === 'function') {
                opts.path = path.build(opts.vars);
            }

            return opts;
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        request: function (track) {
            var opts = track.prev;

            track.logger.info('Outgoing %s %s%s%s', function () {
                return opts.method || 'GET';
            }, function () {
                if (!opts.pathname) {
                    opts.pathname = url.parse(opts.path).pathname;
                }

                if (!opts.protocol) {
                    opts.protocol = 'http:';
                }

                return url.format(opts);
            }, function () {
                var header = '';
                var name;

                for (name in opts.headers) {
                    if (hasProperty.call(opts.headers, name)) {
                        header += '\n\t' + name + ': ' + opts.headers[name];
                    }
                }

                return header;
            }, function () {
                if (opts.body) {
                    if (!opts.bodyEncoding) {
                        opts.bodyEncoding = 'string';
                    }

                    if (bodyEncoders.hasOwnProperty(opts.bodyEncoding)) {
                        return '\n' + bodyEncoders[opts.bodyEncoding](opts.body, function () {});
                    }
                }

                return '';
            });

            return vowAsker(opts);
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        compile: function (track) {
            track.prev.data = JSON.parse(track.prev.data);
            return track.prev;
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_asker}
         * @method
         *
         * @param {Object} track
         *
         * @returns {*}
         * */
        resolve: function (track) {
            return track.prev.data;
        }

    });

};
