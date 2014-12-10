'use strict';

var FistError = require('../../core/fist-error');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var vow = require('vow');
var path = require('path');

function defaultRender(filename, callback) {
    callback(new FistError('NO_ENGINE_FOUND',
        f('There is no engine found for file "%s"', filename)));
}

/**
 * @class Renderer
 * */
function Renderer() {

    /**
     * @protected
     * @memberOf {Renderer}
     * @property
     * @type {Array}
     * */
    this.engines = {};
}

/**
 * @public
 * @memberOf {Renderer}
 * @method
 *
 * @param {String} extname
 * @param {Function} render
 *
 * @returns {Renderer}
 * */
Renderer.prototype.engine = function (extname, render) {
    this.engines[extname] = render;

    return this;
};

/**
 * @public
 * @memberOf {Renderer}
 * @method
 *
 * @param {String} filename
 * @param {*} options
 * */
Renderer.prototype.render = function (filename, options) {
    var defer = vow.defer();
    var extname = path.extname(filename);
    var render = hasProperty.call(this.engines, extname) ?
        this.engines[extname] : defaultRender;

    render(filename, options, function (err, res) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(res);
        }
    });

    return defer.promise();
};

module.exports = function (agent) {
    var views = agent.views = new Renderer();

    /**
     * @class _fist_contrib_unit_controller
     * @extends _fist_contrib_unit
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {String}
         * */
        base: '_fist_contrib_unit',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {String}
         * */
        name: '_fist_contrib_unit_controller',

        /**
         * @private
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         * @constructs
         * */
        __constructor: function () {
            this.__base();

            if (this.rule) {
                agent.route(this.rule, {
                    name: this.name,
                    unit: this.name
                });
            }
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {String}
         * */
        lookupTemplateFilename: function (track, context) {
            /*eslint no-unused-vars: 0*/
            throw new FistError('NOT_IMPLEMENTED', 'You need to implement template lookup function');
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {Number}
         * */
        lookupResponseStatus: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return track.status();
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {Object}
         * */
        lookupResponseHeader: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return {
                'Content-Type': 'text/html'
            };
        },

        createTemplateOptions: function (track, context) {
            return context;
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {vow.Promise}
         * */
        main: function (track, context) {
            var filename = this.lookupTemplateFilename(track, context);

            context = this.createTemplateOptions(track, context);

            return views.render(filename, context).then(function (result) {
                track.
                    status(this.lookupResponseStatus(track, context)).
                    header(this.lookupResponseHeader(track, context)).
                    send(result);
            }, this);
        }
    });

};
