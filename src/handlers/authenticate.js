'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:handlers:authenticate');

const { ArgumentNullError } = require('../helpers/errors');
const Key = require('../helpers/key');
const Session = require('../helpers/session');
const Constants = require('../constants');
const Utility = require('../utility');

module.exports = {
    handler: async event => {
        try {
            debug(event);

            const body = Utility.getBodyOrQuery(event);
            if (!body.id_token) { throw new ArgumentNullError('id_token'); }
            if (!body.state) { throw new ArgumentNullError('state'); }

            const sessionId = body.state;

            let session = await Session.fetchAsync(sessionId);

            const payload = await Key.validateClientTokenAsync(session.data.public_key_uri, body.id_token);
            debug(payload);

            if (!payload.iss) { throw new ArgumentNullError('id_token.iss'); }
            if (!payload.aud) { throw new ArgumentNullError('id_token.aud'); }
            if (!payload.sub) { throw new ArgumentNullError('id_token.sub'); }
            if (!payload.exp) { throw new ArgumentNullError('id_token.exp'); }
            if (!payload.iat) { throw new ArgumentNullError('id_token.iat'); }
            if (!payload.nonce) { throw new ArgumentNullError('id_token.nonce'); }

            const epoch = Utility.epoch();
            if (epoch >= payload.exp) { throw new Error('id_token is expired'); }
            if (payload.iss !== session.data.issuer) { throw new Error('invalid token iss claim'); }
            if (payload.aud !== session.data.client_id) { throw new Error('invalid token aud claim'); }
            if (payload.nonce !== session.data.nonce) { throw new Error('invalid token nonce claim'); }
            if (body.state !== sessionId) { throw new Error('invalid token state claim'); }

            if (session.data.deployment_id && payload[Constants.LTI.Claims.DeploymentId] !== session.data.deployment_id) {
                throw new Error('invalid token lti_deployment_id claim');
            }
            if (payload.azp && payload.azp != session.data.client_id) { throw new Error('invalid token azp claim'); }

            session.data.launch_token = payload;
            await session.saveAsync();

            return {
                statusCode: 302,
                headers: {
                    location: session.data.target_link_uri,
                    'Content-Type': 'text/html',
                    'Set-Cookie': `sid=${session.sessionId};path=/;HttpOnly;Secure;`
                }
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
