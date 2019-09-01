'use strict';

const AWS = require('aws-sdk-mock');
const { assert, expect } = require('chai');
const { JWK, JWS } = require('node-jose');
const nock = require('nock');

const Key = require('../../src/helpers/key');

describe('helpers:key', () => {
    before(() => { nock.disableNetConnect(); });
    after(() => { nock.enableNetConnect(); });
    afterEach(() => {
        assert(nock.isDone(), 'mocked APIs were not called');
        AWS.restore();
    });

    it('fetches key from DynamoDB', async () => {
        const session = new Key(
            'kid',
            {}
        );

        AWS.mock('DynamoDB', 'getItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiKeys');
            expect(p.Key.kid.S).to.equal('kid');
            cb(null, {
                Item: {
                    kid: { S: 'kid' },
                    jwk: { S: '{}' }
                }
            });
        });

        const result = await Key.fetchAsync('kid');

        expect(result).to.deep.equal(session);
    });

    it('saves key to DynamoDB', async () => {
        AWS.mock('DynamoDB', 'putItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiKeys');
            expect(p.Item.kid.S).to.equal('kid');
            expect(p.Item.jwk.S).to.equal(JSON.stringify({}));
            cb(null, null);
        });

        const client = new Key('kid', {});

        await client.saveAsync();
    });

    it('verifies client token', async () => {
        let key = await JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });

        nock('https://domain.com')
            .get('/jwks')
            .reply(200, { keys: [key.toJSON()] });

        let token = { data: 'my token' };

        let signedToken = await JWS.createSign({ format: 'compact' }, key).update(JSON.stringify(token)).final();

        let validatedToken = await Key.validateClientTokenAsync('https://domain.com/jwks', signedToken);

        expect(validatedToken).to.deep.equal(token);
    });
});
