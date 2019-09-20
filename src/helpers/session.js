'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:helpers:session');

const AWS = require('aws-sdk');
const Utility = require('../utility');

class Session {
    constructor(
        sessionId,
        data
    ) {
        this.sessionId = sessionId;
        this.data = data;
    }

    static async fetchAsync(sessionId) {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        const session = await DynamoDB.getItem({
            TableName: 'LtiSessions',
            Key: {
                sessionId: { S: sessionId }
            },
            ConsistentRead: true
        }).promise();
        debug(session);

        if (!session.Item) { throw new Error('session expired'); }

        return new Session(sessionId, JSON.parse(session.Item.data.S));
    }

    async saveAsync() {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        let expiry = new Date().valueOf() + 30000;
        let result = await DynamoDB.putItem({
            TableName: 'LtiSessions',
            Item: {
                sessionId: { S: this.sessionId },
                data: { S: JSON.stringify(this.data) },
                expires: { N: expiry.toString() }
            }
        }).promise();
        debug(result);
    }
}

module.exports = Session;
