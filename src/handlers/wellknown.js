'use strict';

const AWS = require('aws-sdk');
const { JWK } = require('node-jose');

const Key = require('../helpers/key');
const Utility = require('../utility');

module.exports = {
    handler: async () => {
        try {
            const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());
            const keystore = JWK.createKeyStore();

            let result = await DynamoDB.scan({
                TableName: 'LtiKeys',
                ConsistentRead: true
            }).promise();

            for (let item of result.Items) {
                await keystore.add(item.jwk.S, 'json');
            }

            if (keystore.all().length === 0) {
                let jwk = await keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });

                let key = new Key(jwk.kid, jwk.toJSON(true));
                await key.saveAsync();
            }

            return {
                statusCode: 200,
                body: JSON.stringify(keystore.toJSON())
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
