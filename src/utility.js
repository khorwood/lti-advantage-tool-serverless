'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:utility');
const qs = require('querystring');

class Utility {
    static epoch() {
        return Math.floor(new Date().getTime() / 1000);
    }

    static getBodyOrQuery(event) {
        if (!event.body && !event.queryStringParameters) {
            throw new Error('no post body or query was provided');
        }
        if (event.body) {
            return qs.parse(event.body);
        }
        return event.queryStringParameters;
    }

    static getDynamoOptions() {
        if (process.env.IS_OFFLINE) {
            return {
                region: 'localhost',
                endpoint: 'http://localhost:8000',
                accessKeyId: 'offline',
                secretAccessKey: 'offline'
            };
        }
        return null;
    }

    static validateHttpsUrl(url) {
        let test;
        try {
            test = new URL(url);
        } catch (e) {
            throw new Error(`Invalid endpoint: ${url}`);
        }
        if (test.protocol !== 'https:') {
            throw new Error(`Invalid endpoint: ${url} must use https`);
        }
    }

    static autoPostForm(action, data) {
        let formData = Object.keys(data).map(d => `<input type="hidden" name="${d}" value="${data[d]}" />`);

        return `<html>
<body>
    <form action="${action}" method="post" name="myform">
        ${formData.join('')}
        <input type="submit" />
    </form>
    <script language="javascript">
        document.myform.submit();
    </script>
</body>
</html>`;
    }
}

module.exports = Utility;
