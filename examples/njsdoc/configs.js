/*eslint camelcase: 0*/
'use strict';

module.exports = {
    port: 1337,
    logging: {
        logLevel: 'DEBUG'
    },
    unitSettings: {
        _fistlabs_unit_controller: {
            engines: {
                jade: require('consolidate').jade
            }
        }
    }
};
