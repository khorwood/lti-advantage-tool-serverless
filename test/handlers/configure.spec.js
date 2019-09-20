'use strict';

const { assert, expect } = require('chai');
const lambda = require('lambda-tester');
const sinon = require('sinon');

const Client = require('../../src/helpers/client');

const handler = require('../../src/index').configure;

describe('handlers:configure', () => {
    afterEach(() => { sinon.restore(); });

    it('throws with an invalid client', async () => {
        sinon.stub(Client.prototype, 'saveAsync').resolves();

        const body = {
            issuer: 'issuer',
            client_id: 'client_id',
            deployment_id: 'deployment_id',
            audience: 'audience',
            authenticate_uri: 'authenticate_uri',
            public_key_uri: 'public_key_uri',
            token_uri: 'token_uri'
        };

        await lambda(handler)
            .event({
                body: JSON.stringify(body)
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(Client.prototype.saveAsync.notCalled);
            });
    });

    it('saves a valid client', async () => {
        sinon.stub(Client.prototype, 'saveAsync').resolves();

        const body = {
            issuer: 'issuer',
            client_id: 'client_id',
            deployment_id: 'deployment_id',
            audience: 'audience',
            authenticate_uri: 'https://google.com',
            public_key_uri: 'https://google.com',
            token_uri: 'https://google.com'
        };

        await lambda(handler)
            .event({
                body: JSON.stringify(body)
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(200);
                assert(Client.prototype.saveAsync.calledOnce);
            });
    });
});
