'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:handlers:links:nprs');
const request = require('request-promise-native');

const Client = require('../../helpers/client');
const Constants = require('../../constants');
const Session = require('../../helpers/session');

module.exports = {
    handler: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            const endpoint_claim = session.data.launch_token[Constants.NRPS.Claims.Endpoint];
            if (!endpoint_claim) { throw new Error('missing lti-nrps endpoint claim'); }

            const nrps_endpoint = endpoint_claim.context_memberships_url;
            if (!nrps_endpoint) { throw new Error('missing context_memberships_url'); }

            const nrps_versions = endpoint_claim.service_versions;
            if (!nrps_versions || !nrps_versions.includes('2.0')) {
                throw new Error('platform does not declare support for service_versions 2.0');
            }

            const resource_link_claim = session.data.launch_token[Constants.LTI.Claims.ResourceLink];
            if (!resource_link_claim) { throw new Error('missing lti resource link claim'); }

            const resource_link_id = resource_link_claim.id;

            const client = await Client.fetchAsync(session.data.launch_token.issuer);

            const access_token = await client.getToken();

            const memberships = await request.get({
                uri: nrps_endpoint,
                qs: {
                    rlid: resource_link_id
                },
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: `<html>
<body>
    <h1>Success</h1>
    <p>Memberships</p>
    <pre>${JSON.stringify(memberships, null, 4)}</pre>
    <p>Session state:</p>
    <pre>${JSON.stringify(session, null, 4)}</pre>
</body>
</html>`
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
