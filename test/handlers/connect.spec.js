'use strict';

const { assert, expect } = require('chai');
const lambda = require('lambda-tester');
const sinon = require('sinon');
const qs = require('querystring');

const Client = require('../../src/helpers/client');
const Session = require('../../src/helpers/session');

const handler = require('../../src/index').connect;

describe('handlers:connect', () => {
    afterEach(() => { sinon.restore(); });

    it('returns 400 when POST iss missing', async () => {
        await lambda(handler)
            .event({ body: '' })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('no post body or query was provided');
            });
    });

    it('returns 400 when POST login_hint missing', async () => {
        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('Missing argument: login_hint');
            });
    });

    it('returns 400 when POST lti_deployment_id missing', async () => {
        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer', login_hint: 'login_hint' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('Missing argument: lti_deployment_id');
            });
    });

    it('returns 400 when POST target_link_uri missing', async () => {
        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer', login_hint: 'login_hint', lti_deployment_id: 'deployment_id' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('Missing argument: target_link_uri');
            });
    });

    it('returns 400 when client not registered', async () => {
        sinon.stub(Client, 'fetchAsync').callsFake(() => {
            throw new Error('platform iss not registered');
        });

        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer', login_hint: 'login_hint', lti_deployment_id: 'deployment_id', target_link_uri: 'target_link_uri' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('platform iss not registered');
            });
    });

    it('returns 400 when lti_deployment_id not registered', async () => {
        sinon.stub(Client, 'fetchAsync').callsFake(() => {
            return {
                issuer: 'issuer',
                deployment_id: 'lti_deployment_id'
            };
        });

        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer', login_hint: 'login_hint', lti_deployment_id: 'deployment_id', target_link_uri: 'target_link_uri' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(400);
                expect(d.body).to.equal('lti_deployment_id is not registered');
            });
    });

    it('returns 200 when successful', async () => {
        sinon.stub(Client, 'fetchAsync').callsFake(() => {
            return {
                issuer: 'issuer',
                deployment_id: 'deployment_id',
                client_id: 'client_id'
            };
        });

        sinon.stub(Session.prototype, 'saveAsync').callsFake();

        await lambda(handler)
            .event({
                body: qs.stringify({ iss: 'issuer', login_hint: 'login_hint', lti_deployment_id: 'deployment_id', lti_message_hint: 'lti_message_hint', target_link_uri: 'target_link_uri' })
            })
            .expectResolve(d => {
                expect(d.statusCode).to.equal(200);
                expect(d.headers['Set-Cookie']).to.not.be.null;
                assert(Session.prototype.saveAsync.calledOnce);
            });
    });
});
