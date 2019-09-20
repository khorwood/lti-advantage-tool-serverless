'use strict';

const AWS = require('aws-sdk-mock');
const { expect } = require('chai');
const { JWK } = require('node-jose');
const lambda = require('lambda-tester');

const handler = require('../../src/index').wellknown;

describe('handlers:wellknown', () => {
    afterEach(() => {
        AWS.restore();
    });

    it('returns existing public keyset from DynamoDB', async () => {
        let key = await JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
        AWS.mock('DynamoDB', 'scan', (p, cb) => {
            if (p.TableName !== 'LtiKeys') { return cb('incorrect table name'); }
            return cb(null, {
                Items: [{
                    kid: { S: key.kid },
                    jwk: {
                        S: JSON.stringify(key.toJSON(true))
                    }
                }]
            });
        });

        await lambda(handler)
            .expectResolve(d => {
                expect(d.statusCode).to.equal(200);
                const body = JSON.parse(d.body);
                expect(body.keys[0]).to.deep.equal(key.toJSON());
            });
    });

    it('returns a new public keyset', async () => {
        let key;
        AWS.mock('DynamoDB', 'scan', (p, cb) => {
            if (p.TableName !== 'LtiKeys') { return cb('incorrect table name'); }
            return cb(null, {
                Items: []
            });
        });
        AWS.mock('DynamoDB', 'putItem', async (p, cb) => {
            key = await JWK.asKey(p.Item.jwk.S, 'json');
            return cb(null, null);
        });

        await lambda(handler)
            .expectResolve(d => {
                expect(d.statusCode).to.equal(200);
                const body = JSON.parse(d.body);
                expect(body.keys[0]).to.deep.equal(key.toJSON());
            });
    });
});
