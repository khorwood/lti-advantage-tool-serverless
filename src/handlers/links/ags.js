'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:handlers:links:ags');
const request = require('request-promise-native');
const qs = require('querystring');

const { ArgumentNullError } = require('../../helpers/errors');
const Client = require('../../helpers/client');
const Constants = require('../../constants');
const Session = require('../../helpers/session');
const Utility = require('../../utility');

module.exports = {
    handler: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            const endpoint_claim = session.data.launch_token[Constants.AGS.Claims.Endpoint];
            if (!endpoint_claim) { throw new Error('missing lti-ags endpoint claim'); }

            const lineitems_endpoint = endpoint_claim.lineitems;
            if (!lineitems_endpoint) { throw new Error('missing lineitems url'); }

            debug(lineitems_endpoint);

            const resource_link_claim = session.data.launch_token[Constants.LTI.Claims.ResourceLink];
            if (!resource_link_claim) { throw new Error('missing lti resource link claim'); }

            const client = await Client.fetchAsync(session.data.issuer);
            debug(client);

            const access_token = await client.getTokenAsync();

            const lineitems = await request.get({
                uri: lineitems_endpoint,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            const forms = lineitems.map(i => `<form method="post" action="${process.env.BASE_URI}/links/ags_create">
    <input type="hidden" name="id" value="${i.id}" />
    <input type="hidden" name="resourceLinkId" value="${i.resourceLinkId}" />
    <label for="scoreMaximum">Score Maximum:</label>
    <input type="number" name="scoreMaximum" value="${i.scoreMaximum}" />
    <label for="label">Label:</label>
    <input type="text" name="label" value="${i.label}" />
    <label for="tag">Tag:</label>
    <input type="text" name="tag" value="${i.tag}" />
    <label for="resourceId">Resource Id:</label>
    <input type="text" name="resourceId" value="${i.resourceId}" />
    <input type="submit" value="Update" />
</form>`);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: `<html>
<body>
    <h1>Line Items</h1>
    <form method="post" action="${process.env.BASE_URI}/links/ags_create">
        <label for="scoreMaximum">Score Maximum:</label>
        <input type="number" name="scoreMaximum" />
        <label for="label">Label:</label>
        <input type="text" name="label" />
        <label for="tag">Tag:</label>
        <input type="text" name="tag" />
        <label for="resourceId">Resource Id:</label>
        <input type="text" name="resourceId" />
        <input type="submit" value="Create" />
    </form>
    ${forms.join('\n')}
    <p>JSON:</p>
    <pre>${JSON.stringify(lineitems, null, 4)}</pre>
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
    },
    create_form: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: `<html>
<body>
    <p>Create:</p>
    <form method="post" action="${process.env.BASE_URI}/links/ags_create">
        <label for="scoreMaximum">Score Maximum:</label>
        <input type="number" name="scoreMaximum" />
        <label for="label">Label:</label>
        <input type="text" name="label" />
        <label for="tag">Tag:</label>
        <input type="text" name="tag" />
        <label for="resourceId">Resource Id:</label>
        <input type="text" name="resourceId" />
        <input type="submit" />
    </form>
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
    },
    create: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            const endpoint_claim = session.data.launch_token[Constants.AGS.Claims.Endpoint];
            if (!endpoint_claim) { throw new Error('missing lti-ags endpoint claim'); }

            const lineitems_endpoint = endpoint_claim.lineitems;
            if (!lineitems_endpoint) { throw new Error('missing lineitems url'); }

            debug(lineitems_endpoint);

            const resource_link_claim = session.data.launch_token[Constants.LTI.Claims.ResourceLink];
            if (!resource_link_claim) { throw new Error('missing lti resource link claim'); }

            const body = qs.parse(event.body);

            if (!body.scoreMaximum) { throw new ArgumentNullError('max_score'); }
            if (!body.label) { throw new ArgumentNullError('label'); }
            if (!body.tag) { throw new ArgumentNullError('tag'); }
            if (!body.resourceId) { throw new ArgumentNullError('resource_id'); }

            const lineitem = {
                scoreMaximum: body.scoreMaximum,
                label: body.label,
                tag: body.tag,
                resourceId: body.resourceId,
                resourceLinkId: resource_link_claim.id,
                startDateTime: new Date().toISOString(),
                endDateTime: new Date().toISOString()
            };
            debug(lineitem);

            const client = await Client.fetchAsync(session.data.issuer);
            debug(client);

            const access_token = await client.getTokenAsync();

            let response;
            if (body.id) {
                response = await request.put({
                    uri: body.id,
                    body: lineitem,
                    headers: { authorization: `Bearer ${access_token}` },
                    json: true
                });
            } else {
                response = await request.post({
                    uri: lineitems_endpoint,
                    body: lineitem,
                    headers: { authorization: `Bearer ${access_token}` },
                    json: true
                });
            }
            debug(response);

            return {
                statusCode: 302,
                headers: {
                    location: `${process.env.BASE_URI}/links/ags`
                }
            };
        } catch (e) {
            debug(e);
            if (!e.statusCode) {
                e.body = e.message;
                e.statusCode = 400;
                e.headers = {
                    'Content-Type': 'text/html'
                };
            }
            return e;
        }
    },
    scores: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            let body = Utility.getBodyOrQuery(event);
            let lineitem_id = body.lineitem_id;

            const client = await Client.fetchAsync(session.data.issuer);
            debug(client);

            const access_token = await client.getTokenAsync();

            let scores = await request.get({
                uri: lineitem_id,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            const forms = scores.map(i => `<form method="post" action="${process.env.BASE_URI}/links/ags_score_create">
    <input type="hidden" name="id" value="${i.id}" />
    <input type="hidden" name="resourceLinkId" value="${i.resourceLinkId}" />
    <label for="scoreMaximum">Score Maximum:</label>
    <input type="number" name="scoreMaximum" value="${i.scoreMaximum}" />
    <label for="label">Label:</label>
    <input type="text" name="label" value="${i.label}" />
    <label for="tag">Tag:</label>
    <input type="text" name="tag" value="${i.tag}" />
    <label for="resourceId">Resource Id:</label>
    <input type="text" name="resourceId" value="${i.resourceId}" />
    <input type="submit" value="Update" />
</form>`);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: `<html>
<body>
    <h1>Scores</h1>
    <form method="post" action="${process.env.BASE_URI}/links/ags_score_create">
        <label for="scoreMaximum">Score Maximum:</label>
        <input type="number" name="scoreMaximum" />
        <label for="label">Label:</label>
        <input type="text" name="label" />
        <label for="tag">Tag:</label>
        <input type="text" name="tag" />
        <label for="resourceId">Resource Id:</label>
        <input type="text" name="resourceId" />
        <input type="submit" value="Create" />
    </form>
    ${forms.join('\n')}
    <p>JSON:</p>
    <pre>${JSON.stringify(scores, null, 4)}</pre>
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
