'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:handlers:configure');

const Client = require('../helpers/client');

/*
{
    "issuer": "<issuer>",
    "client_id": "<client_id>",
    "deployment_id": "<deployment_id>",
    "audience": "<audience>",
    "authenticate_uri": "<authenticate_uri>",
    "public_key_uri": "<public_key_uri>",
    "token_uri": "<token_uri>"
}
*/

module.exports = {
    handler: async event => {
        try {
            const payload = JSON.parse(event.body);
            debug(payload);

            const client = new Client(
                payload.issuer,
                payload.client_id,
                payload.deployment_id,
                payload.audience,
                payload.authenticate_uri,
                payload.public_key_uri,
                payload.token_uri
            );

            await client.saveAsync();

            return {
                statusCode: 200
            };
        } catch (e) {
            if (!e.statusCode) {
                e.body = e.message;
                e.statusCode = 400;
            }
            return e;
        }
    }
};
