'use strict';

const debug = require('debug')('lti-advantage-tool:handlers:connect');
const uuid = require('uuid');

const { ArgumentNullError } = require('../helpers/errors');
const Client = require('../helpers/client');
const Session = require('../helpers/session');
const Utility = require('../utility');

module.exports = {
    handler: async event => {
        try {
            const payload = Utility.getBodyOrQuery(event);
            debug(payload);

            if (!payload.iss) { throw new ArgumentNullError('iss'); }
            if (!payload.login_hint) { throw new ArgumentNullError('login_hint'); }
            if (!payload.lti_deployment_id) { throw new ArgumentNullError('lti_deployment_id'); }
            if (!payload.target_link_uri) { throw new ArgumentNullError('target_link_uri'); }

            const client = await Client.fetchAsync(payload.iss);

            if (client.deployment_id !== payload.lti_deployment_id) { throw new Error('lti_deployment_id is not registered'); }

            let data = Object.assign({}, client, {
                target_link_uri: payload.target_link_uri,
                nonce: uuid()
            });

            const session = new Session(uuid(), data);
            await session.saveAsync();

            let response = {
                scope: 'openid',
                response_type: 'id_token',
                client_id: client.client_id,
                redirect_uri: `${process.env.BASE_URI}/authenticate`,
                login_hint: payload.login_hint,
                response_mode: 'form_post',
                state: session.sessionId,
                nonce: data.nonce,
                prompt: 'none'
            };

            if (payload.lti_message_hint) {
                response.lti_message_hint = payload.lti_message_hint;
            }

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: Utility.autoPostForm(client.authenticate_uri, response)
            };
        } catch (e) {
            if (!e.statusCode) {
                e.body = e.message;
                e.statusCode = 400;
                e.headers = {
                    'Content-Type': 'text/html'
                };
            }
            return e;
        }
    }
};
