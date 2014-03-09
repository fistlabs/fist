'use strict';

function millis (mean) {

    return ( mean * 1000 ).toFixed(3);
}

function msFormat (mean) {

    return millis(mean) + 'ms/op';
}

function operations (mean) {

    return ( 1 / mean ).toFixed(0);
}

function opFormat (mean) {

    return operations(mean) + 'op/s';
}

module.exports = function (bench) {

    var mean = bench.stats.mean;

    return opFormat(mean) + ' (' + msFormat(mean) + ')';
};
