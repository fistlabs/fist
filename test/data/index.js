'use strict';

exports.deps = ['className', 'error', 'data', 'knot'];

exports.data = function (track, result, done, errors) {

    track.send(200, {
        result: result,
        errors: errors
    });
};
