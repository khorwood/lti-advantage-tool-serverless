'use strict';

const AWS = require('aws-sdk-mock');
const { assert, expect } = require('chai');

const Client = require('../../src/helpers/client');

describe('helpers:client', () => {
    afterEach(() => {
        AWS.restore();
    });

    it('throws when issuer missing', () => {
        try {
            new Client();
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: issuer');
        }
    });

    it('throws when client_id missing', () => {
        try {
            new Client('issuer');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: client_id');
        }
    });

    it('throws when deployment_id missing', () => {
        try {
            new Client('issuer', 'client_id');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: deployment_id');
        }
    });

    it('throws when audience missing', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: audience');
        }
    });

    it('throws when authenticate_uri missing', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: authenticate_uri');
        }
    });

    it('throws when public_key_uri missing', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience', 'authenticate_uri');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: public_key_uri');
        }
    });

    it('throws when token_uri missing', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience', 'authenticate_uri', 'public_key_uri');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Missing argument: token_uri');
        }
    });

    it('throws when authenticate_uri is not https', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience', 'authenticate_uri', 'public_key_uri', 'token_uri');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Invalid endpoint: authenticate_uri');
        }
    });

    it('throws when public_key_uri is not https', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience', 'https://google.com', 'public_key_uri', 'token_uri');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Invalid endpoint: public_key_uri');
        }
    });

    it('throws when token_uri is not https', () => {
        try {
            new Client('issuer', 'client_id', 'deployment_id', 'audience', 'https://google.com', 'https://google.com', 'token_uri');
            assert.fail('did not throw');
        } catch (e) {
            expect(e.message).to.equal('Invalid endpoint: token_uri');
        }
    });

    it('fetches client from DynamoDB', async () => {
        const client = {
            issuer: 'issuer',
            client_id: 'client_id',
            deployment_id: 'deployment_id',
            audience: 'audience',
            authenticate_uri: 'https://google.com',
            public_key_uri: 'https://google.com',
            token_uri: 'https://google.com'
        };

        AWS.mock('DynamoDB', 'getItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiClients');
            expect(p.Key.issuer.S).to.equal('issuer');
            cb(null, {
                Item: {
                    issuer: { S: 'issuer' },
                    client: {
                        S: JSON.stringify(client)
                    }
                }
            });
        });

        const result = await Client.fetchAsync('issuer');

        expect(result).to.deep.equal(client);
    });

    it('saves client to DynamoDB', async () => {
        AWS.mock('DynamoDB', 'putItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiClients');
            expect(p.Item.issuer.S).to.equal('issuer');
            expect(p.Item.client.S).to.equal(JSON.stringify({
                issuer: 'issuer',
                client_id: 'client_id',
                deployment_id: 'deployment_id',
                audience: 'audience',
                authenticate_uri: 'https://google.com',
                public_key_uri: 'https://google.com',
                token_uri: 'https://google.com'
            }));
            cb(null, null);
        });

        const client = new Client('issuer', 'client_id', 'deployment_id', 'audience', 'https://google.com', 'https://google.com', 'https://google.com');

        await client.saveAsync();
    });
});
