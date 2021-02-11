function Deploy(server) {
    console.log("ClustersController called")
    require('./strategies/ControlContainer');

    const ClusterStart = require('./start');
    const ClusterCommand = require('./command');

    const { responseModifierMiddleware, requestBodyJSONMiddleware } = require('../privatesky/modules/apihub/utils/middlewares');

    server.use(`/controlContainer/*`, responseModifierMiddleware);

    server.put(`/controlContainer/:number/start`, requestBodyJSONMiddleware);
    server.put(`/controlContainer/:number/start`, ClusterStart);

    server.put(`/controlContainer/:number/command/:command`, requestBodyJSONMiddleware);
    server.put(`/controlContainer/:number/command/:command`, ClusterCommand);
}

module.exports = Deploy;