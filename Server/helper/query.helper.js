/**
 * Query Helper
 * konstantyn
 * 2018-03-10
 */

var pg = require('pg');
var dbConfig = require('../config/db.config');
var responseHelper = require('./response.helper');
var Base64 = require('js-base64').Base64;

module.exports = {
    base64(string, direction = 1) {
        if (direction) {
            return Base64.encode(string);
        } else {
            return Base64.decode(string);
        }
    },

    /**
     * 
     * @param {*} query 
     * @param {*} param 
     * @param {*} callback 
     */
    runQuery(query, param, callback) {
        try {
            var client = new pg.Client(dbConfig);

            client.connect((err) => {
                if (err) {
                    responseHelper.onError('error: runQuery' + err, callback);
                    return;
                }

                client.query(query, param, (_err, _result) => {
                    if (_err) {
                        responseHelper.onError('error: runQuery' + _err, callback);
                        return;
                    }
                    client.end((__err) => {
                        if (__err) {
                            responseHelper.onError('error: runQuery' + __err, callback);
                            return;
                        }
                    });
                    responseHelper.onSuccess(callback, _result);
                });
            });
        } catch(err) {
            responseHelper.onError('error: runQuery' + err, callback);
        }
    }
}