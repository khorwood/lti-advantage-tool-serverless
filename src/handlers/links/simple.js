'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:handlers:links:simple');

const Session = require('../../helpers/session');

module.exports = {
    handler: async event => {
        try {
            debug(event);
            if (!event.headers.Cookie) { throw new Error('session expired'); }
            const sessionId = event.headers.Cookie.slice(4);

            let session = await Session.fetchAsync(sessionId);
            if (!session) { throw new Error('session expired'); }

            return {
                statusCode: 200,
                headers:{
                    'Content-Type': 'text/html'
                },
                body: `<html>
<body>
    <h1>Success</h1>
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
