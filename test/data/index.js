'use strict';

exports.deps = ['className', 'error', 'data', 'action'];

exports.data = function (track, result, done, errors) {

    track.send(200, {
        result: result,
        errors: errors
    });
};
