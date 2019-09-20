'use strict';

const AWS = require('aws-sdk-mock');
const { expect } = require('chai');

const Session = require('../../src/helpers/session');

describe('helpers:session', () => {
    afterEach(() => {
        AWS.restore();
    });

    it('fetches session from DynamoDB', async () => {
        const session = new Session(
            'sessionId',
            {
                item: 'item'
            });

        AWS.mock('DynamoDB', 'getItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiSessions');
            expect(p.Key.sessionId.S).to.equal('sessionId');
            cb(null, {
                Item: {
                    sessionId: { S: 'sessionId' },
                    data: {
                        S: JSON.stringify({ item: 'item' })
                    }
                }
            });
        });

        const result = await Session.fetchAsync('sessionId');

        expect(result).to.deep.equal(session);
    });

    it('saves session to DynamoDB', async () => {
        AWS.mock('DynamoDB', 'putItem', (p, cb) => {
            expect(p.TableName).to.equal('LtiSessions');
            expect(p.Item.sessionId.S).to.equal('sessionId');
            expect(p.Item.data.S).to.equal(JSON.stringify({
                item: 'item'
            }));
            cb(null, null);
        });

        const client = new Session('sessionId', { item: 'item' });

        await client.saveAsync();
    });
});
