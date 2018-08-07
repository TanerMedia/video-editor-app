/**
 * User Model
 * konstantyn
 * 2018-03-10
 */

var helper = require('../helper/helper');

module.exports = {
    /**
     * 
     * @param {*} usr_id 
     * @param {*} callback 
     */
    getUserById(usr_id, callback) {
        try {
            helper.query.runQuery('SELECT * from public.user where usr_id = $1', [usr_id], (err, result) => {
                if (err) {
                    helper.response.onError('error: getUserById' + err, callback);
                    return;
                }
                
                if (result.rows.length === 0) {
                    helper.response.onError('error: getUserById' + 'no exist user id' + usr_id, callback);
                }
                let user = result.rows[0];
                helper.response.onSuccess(callback, user);
            });
        } catch(err) {
            helper.response.onError('error: getUserById' + err, callback);
        }
    },

    /**
     * 
     * @param {*} usr_email 
     * @param {*} callback 
     */
    getUserByEmail(usr_email, callback) {
        try {
            helper.query.runQuery('SELECT u.* FROM public.user as u WHERE LOWER(u.usr_email) = LOWER($1)', [usr_email], (err, result) => {
                if (err) {
                    helper.response.onError('error: getUserByEmail' + err, callback);
                    return;
                }

                if (result.rows.length === 0) {
                    helper.response.onError('error: getUserByEmail' + 'no exist user email' + usr_email, callback);
                }

                let user = result.rows[0];
                helper.response.onSuccess(callback, user);                
            });
        } catch(err) {
            helper.response.onError('error: getUserByEmail' + err, callback);
        }
    },

    /**
     * 
     * @param {*} usr_id 
     * @param {*} callback 
     */
    verifyByUsrId(usr_id, callback) {
        try {
            helper.model.update('user', [
                {
                    name: 'usr_is_verified',
                    value: true
                }
            ], [
                    {
                        name: 'usr_id =',
                        value: usr_id
                    }
                ], (err) => {
                    if (err) {
                        helper.response.onError('error: verifyByUsrId' + err, callback);
                        return;
                    }

                    helper.response.onSuccessPlus(callback);
                });
        } catch (err) {
            helper.response.onError('error: verifyByUsrId' + err, callback);
        }
    },

    updateUserByUsrId(usr_id, data, callback) {
        try {
            helper.model.update('user', data, [
                {
                    name: 'usr_id =',
                    value: usr_id
                }
            ], (err) => {
                if (err) {
                    helper.response.onError('error: updateUser' + err, callback);
                    return;
                }

                helper.response.onSuccess(callback);
            });
        } catch (err) {
            helper.response.onError('error: updateUser' + err, callback);
        }
    },

    /**
     * 
     * @param {*} usr_id 
     * @param {*} usr_password 
     * @param {*} callback 
     */
    updatePasswordByUsrId(usr_id, usr_password, callback) {
        try {
            helper.model.update('user', [
                {
                    name: 'usr_password',
                    value: usr_password,
                }
            ], [
                    {
                        name: 'usr_id =',
                        value: usr_id
                    }
                ], (err) => {
                    if (err) {
                        helper.response.onError('error: updatePasswordByUsrId' + err, callback);
                        return;
                    }

                    helper.response.onSuccessPlus(callback);
                });
        } catch (err) {
            helper.response.onError('error: updatePasswordByUsrId' + err, callback);
        }
    },

    /**
     * 
     * @param {*} usr_id 
     * @param {*} callback 
     */
    updateLastLoginDateByUsrId(usr_id, callback) {
        try {
            helper.query.runQuery('UPDATE public.user set usr_lastlogin_at = CURRENT_TIMESTAMP WHERE usr_id = $1', [usr_id], (err, result) => {
                if (err) {
                    helper.response.onError('error: updateLastLoginDateById' + err, callback);
                    return;
                }
                helper.response.onSuccess(callback);
            });
        } catch(err) {
            helper.response.onError('error: updateLastLoginDateById' + err, callback);
        }
    },

    /**
     * 
     * @param {*} usr_email 
     * @param {*} callback 
     */
    isEmailExist(usr_email, callback) {
        try {
            helper.query.runQuery('SELECT COUNT(*) FROM public.user WHERE LOWER(usr_email) = LOWER($1)', [usr_email], (err, result) => {
                if (err) {
                    helper.response.onError('error: isEmailExist' + err, callback);
                    return;
                }

                helper.response.onSuccess(callback, result.rows[0].count != 0);
            });
        } catch (err) {
            helper.response.onError('error: isEmailExist' + err, callback);
        }
    },

    /**
     * 
     * @param {*} data 
     * @param {*} callback 
     */
    addUser(data, callback) {
        try {
            this.isEmailExist(data.usr_email, (err, result) => {
                if (err) {
                    helper.response.onError('error: addUser' + err, callback);
                    return;
                }

                if (result) {
                    helper.response.onError('error: addUser' + ' already exist user', callback);
                    return;
                }

                helper.query.runQuery('INSERT INTO public.user (usr_email, usr_password, usr_name, usr_company) SELECT $1, $2, $3, $4 RETURNING usr_id, usr_created_at', [data.usr_email, data.usr_password, data.usr_name, data.usr_company], (_err, _result) => {
                    if (_err) {
                        helper.response.onError('error: createUser' + _err, callback);
                        return;
                    }

                    let row = _result.rows[0];
                    helper.response.onSuccessPlus(callback, {
                        usr_id : row.usr_id,
                        usr_created_at : row.usr_created_at,
                    });
                });
            });
        } catch(err) {
            helper.response.onError('error: createUser' + err, callback);
        }
    },
}