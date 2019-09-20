'use strict';

const { assert, expect } = require('chai');
const lambda = require('lambda-tester');
const qs = require('querystring');
const sinon = require('sinon');

const Key = require('../../src/helpers/key');
const Session = require('../../src/helpers/session');
const Utility = require('../../src/utility');

const handler = require('../../src/index').authenticate;

describe('handlers:authenticate', () => {
    afterEach(() => { sinon.restore(); });

    it('returns 400 without body', async () => {
        await lambda(handler)
            .event({
                headers: {},
                body: ''
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('no post body or query was provided');
            });
    });

    it('returns 400 with invalid iss claim', async () => {
        sinon.stub(Session, 'fetchAsync').callsFake(() => {
            return new Session(
                'sessionId',
                {});
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        sinon.stub(Key, 'validateClientTokenAsync').callsFake(() => {
            return {
                iss: 'issuer',
                aud: 'client_id',
                sub: 'sub',
                exp: Utility.epoch() + 10000,
                iat: Utility.epoch() - 10000,
                nonce: 'nonce',
                state: 'sessionId'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({
                    id_token: 'token',
                    state: 'sessionId'
                }),
                headers: {
                    Cookie: 'sid:sessionId'
                }
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('invalid token iss claim');
                assert(Session.prototype.saveAsync.notCalled);
            });
    });

    it('returns 400 with invalid aud claim', async () => {
        sinon.stub(Session, 'fetchAsync').callsFake(() => {
            return new Session(
                'sessionId',
                {
                    issuer: 'issuer'
                });
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        sinon.stub(Key, 'validateClientTokenAsync').callsFake(() => {
            return {
                iss: 'issuer',
                aud: 'client_id',
                sub: 'sub',
                exp: Utility.epoch() + 10000,
                iat: Utility.epoch() - 10000,
                nonce: 'nonce',
                state: 'sessionId'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({
                    id_token: 'token',
                    state: 'sessionId'
                }),
                headers: {
                    Cookie: 'sid:sessionId'
                }
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('invalid token aud claim');
                assert(Session.prototype.saveAsync.notCalled);
            });
    });

    it('returns 400 with invalid nonce claim', async () => {
        sinon.stub(Session, 'fetchAsync').callsFake(() => {
            return new Session(
                'sessionId',
                {
                    issuer: 'issuer',
                    client_id: 'client_id'
                });
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        sinon.stub(Key, 'validateClientTokenAsync').callsFake(() => {
            return {
                iss: 'issuer',
                aud: 'client_id',
                sub: 'sub',
                exp: Utility.epoch() + 10000,
                iat: Utility.epoch() - 10000,
                nonce: 'nonce',
                state: 'sessionId'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({
                    id_token: 'token',
                    state: 'sessionId'
                }),
                headers: {
                    Cookie: 'sid:sessionId'
                }
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('invalid token nonce claim');
                assert(Session.prototype.saveAsync.notCalled);
            });
    });

    it('returns 400 with invalid lti_deployment_id claim', async () => {
        sinon.stub(Session, 'fetchAsync').callsFake(() => {
            return new Session(
                'sessionId',
                {
                    issuer: 'issuer',
                    client_id: 'client_id',
                    nonce: 'nonce',
                    public_key_uri: 'https://domain.com',
                    deployment_id: 'x'
                });
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        sinon.stub(Key, 'validateClientTokenAsync').callsFake(() => {
            return {
                iss: 'issuer',
                aud: 'client_id',
                sub: 'sub',
                exp: Utility.epoch() + 10000,
                iat: Utility.epoch() - 10000,
                nonce: 'nonce',
                state: 'sessionId'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({
                    id_token: 'token',
                    state: 'sessionId'
                }),
                headers: {
                    Cookie: 'sid:sessionId'
                }
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('invalid token lti_deployment_id claim');
                assert(Session.prototype.saveAsync.notCalled);
            });
    });

    it('returns 200 with valid session cookie and id_token', async () => {
        sinon.stub(Session, 'fetchAsync').callsFake(() => {
            return new Session(
                'sessionId',
                {
                    issuer: 'issuer',
                    client_id: 'client_id',
                    nonce: 'nonce',
                    public_key_uri: 'https://domain.com'
                });
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        sinon.stub(Key, 'validateClientTokenAsync').callsFake(() => {
            return {
                iss: 'issuer',
                aud: 'client_id',
                sub: 'sub',
                exp: Utility.epoch() + 10000,
                iat: Utility.epoch() - 10000,
                nonce: 'nonce',
                state: 'sessionId'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({
                    id_token: 'token',
                    state: 'sessionId'
                }),
                headers: {
                    Cookie: 'sid:sessionId'
                }
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(302);
                assert(Session.prototype.saveAsync.calledOnce);
            });
    });
});
