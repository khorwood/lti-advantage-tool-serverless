'use strict';

const debug = require('debug')('lti-advantage-tool-serverless:helpers:client');
const request = require('request-promise-native');
const uuid = require('uuid');

const AWS = require('aws-sdk');
const { ArgumentNullError } = require('./errors');
const Constants = require('../constants');
const Key = require('./key');
const Utility = require('../utility');

class Client {
    constructor(
        issuer,
        client_id,
        deployment_id,
        audience,
        authenticate_uri,
        public_key_uri,
        token_uri
    ) {
        if (!issuer) { throw new ArgumentNullError('issuer'); }
        if (!client_id) { throw new ArgumentNullError('client_id'); }
        if (!deployment_id) { throw new ArgumentNullError('deployment_id'); }
        if (!audience) { throw new ArgumentNullError('audience'); }
        if (!authenticate_uri) { throw new ArgumentNullError('authenticate_uri'); }
        if (!public_key_uri) { throw new ArgumentNullError('public_key_uri'); }
        if (!token_uri) { throw new ArgumentNullError('token_uri'); }

        Utility.validateHttpsUrl(authenticate_uri);
        Utility.validateHttpsUrl(public_key_uri);
        Utility.validateHttpsUrl(token_uri);

        this.issuer = issuer;
        this.client_id = client_id;
        this.deployment_id = deployment_id;
        this.audience = audience;
        this.authenticate_uri = authenticate_uri;
        this.public_key_uri = public_key_uri;
        this.token_uri = token_uri;
    }

    static async fetchAsync(issuer) {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        let client = await DynamoDB.getItem({
            TableName: 'LtiClients',
            Key: {
                issuer: { S: issuer }
            },
            ConsistentRead: true
        }).promise();
        debug(client);

        if (!client.Item) { throw new Error('platform iss not registered'); }

        let data = JSON.parse(client.Item.client.S);

        return new Client(
            data.issuer,
            data.client_id,
            data.deployment_id,
            data.audience,
            data.authenticate_uri,
            data.public_key_uri,
            data.token_uri
        );
    }

    async getTokenAsync() {
        const client_assertion = {
            iss: this.client_id,
            sub: this.client_id,
            aud: this.audience,
            iat: Utility.epoch(),
            exp: Utility.epoch() + 1000,
            jti: uuid()
        };

        const key = await Key.fetchPrivateKeyAsync();

        const signed_assertion = await key.signAsync(client_assertion);

        const assertion = {
            grant_type: Constants.OAuth2.GrantTypes.ClientCredentials,
            client_assertion_type: Constants.OAuth2.AssertionTypes.JwtBearer,
            client_assertion: signed_assertion,
            scope: `${Constants.AGS.Scopes.LineItem} ${Constants.AGS.Scopes.Result} ${Constants.AGS.Scopes.Score} ${Constants.NRPS.Scopes.Membership}`
        };

        debug(assertion);

        const response = await request.post(
            this.token_uri,
            {
                form: assertion,
                json: true
            });

        debug(response);

        return response.access_token;
    }

    async saveAsync() {
        const DynamoDB = new AWS.DynamoDB(Utility.getDynamoOptions());

        let result = await DynamoDB.putItem({
            TableName: 'LtiClients',
            Item: {
                issuer: { S: this.issuer },
                client: { S: JSON.stringify(this) }
            }
        }).promise();
        debug(result);
    }
}

module.exports = Client;
