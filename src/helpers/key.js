'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:helpers:keys');

const AWS = require('aws-sdk');
const { JWK, JWS } = require('node-jose');
const request = require('request-promise-native');
const Utility = require('../utility');

class Key {
    constructor(
        kid,
        jwk
    ) {
        this.kid = kid;
        this.jwk = jwk;
    }

    static async fetchAsync(kid) {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        const key = await DynamoDB.getItem({
            TableName: 'LtiKeys',
            Key: {
                kid: { S: kid }
            },
            ConsistentRead: true
        }).promise();

        if (!key.Item) { throw new Error(`Key not found with kid: ${kid}`); }

        let jwk = JSON.parse(key.Item.jwk.S);

        return new Key(kid, jwk);
    }

    static async fetchPrivateKeyAsync() {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        const keys = await DynamoDB.scan({
            TableName: 'LtiKeys',
            ConsistentRead: true
        }).promise();

        if (!keys.Items) { throw new Error('no private key found'); }

        let jwk = JSON.parse(keys.Items[0].jwk.S);

        return new Key(keys.Items[0].kid.S, jwk);
    }

    async signAsync(payload) {
        return await JWS.createSign({ compact: true }, this.jwk)
            .update(JSON.stringify(payload))
            .final();
    }

    async saveAsync() {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        await DynamoDB.putItem({
            TableName: 'LtiKeys',
            Item: {
                kid: { S: this.kid },
                jwk: { S: JSON.stringify(this.jwk) }
            }
        }).promise();
    }

    static async validateClientTokenAsync(public_key_uri, id_token) {
        const publicKeys = JWK.createKeyStore();
        try {
            let keySet = await request.get(public_key_uri, { json: true, timeout: 500 });

            for (let key of keySet.keys) {
                await publicKeys.add(key, 'json');
            }
        } catch (e) {
            debug(e);
            throw new Error(`unable to fetch JWKS from: ${public_key_uri}`);
        }

        const token = await JWS.createVerify(publicKeys).verify(id_token);
        debug(token);

        if (token.header.alg !== 'RS256') { throw new Error('id_token.alg must be RS256'); }
        return JSON.parse(token.payload.toString('utf8'));
    }
}

module.exports = Key;
