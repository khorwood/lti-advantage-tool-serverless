'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.REGION || 'us-east-1' });

module.exports = {
    authenticate: require('./handlers/authenticate').handler,
    configure: require('./handlers/configure').handler,
    connect: require('./handlers/connect').handler,
    wellknown: require('./handlers/wellknown').handler,
    links_simple: require('./handlers/links/simple').handler,
    links_ags: require('./handlers/links/ags').handler,
    links_ags_create_form: require('./handlers/links/ags').create_form,
    links_ags_create: require('./handlers/links/ags').create,
    links_ags_scores: require('./handlers/links/ags').scores,
    links_ags_scores_post: require('./handlers/links/ags').scores_post,
    links_nrps: require('./handlers/links/nrps').handler
};
