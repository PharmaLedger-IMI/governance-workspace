

function getJobExecutionStatus(jenkinsQueue, jenkinsServer, callback){
    // check the queue
    //GET : http://127.0.0.1:8090/queue/item/106/api/json
    // get from json body :
    //"executable": {
    //         "_class": "org.jenkinsci.plugins.workflow.job.WorkflowRun",
    //         "number": 11,
    //         "url": "http://localhost:8090/job/initiateNetwork/11/"
    //     }
    // the build number
    // do a loop to try to get the build No. If the build didn't started, the number will not exist
    //check the build status once the build was started and we got a build no
    // GET http://localhost:8090/job/initiateNetwork/11/api/json
    // json body :
    // "artifacts": [],
    //     "building": true,
    // loop until you get :
    //     "artifacts": [],
    //     "building": false,
    //      "result": "SUCCESS",
    // build is now finished and the result of the build is returned


    // loop every 10 sec to see if job is started or still in queue mode
    //apiPath =  http://127.0.0.1:8090/queue/item/80/
    loopUntilBuildStarts(jenkinsQueue, jenkinsServer, (err, data) => {
        if (err) {return callback(err)}
        //we got build no
        //console.log('build no : ', data);
        const buildNo = data;
        loopUntilBuildFinishes(jenkinsServer, buildNo, (err, buildResult) => {
            if (err) {return callback(err, undefined)}
            console.log(buildResult);
            return callback(undefined, buildResult);
        })
    })
}

function loopUntilBuildStarts(jenkinsQueue, jenkinsServer, callback){

    checkIfJobStarted(jenkinsQueue, jenkinsServer, (err, data) => {
        if (err) {return callback(err,undefined)}
        if (data !== -1)
        {
            console.log('Pipeline is building - '+jenkinsServer.jenkinsPipeline+'. Build number : ', data);
            return callback(undefined, data);
        }
        setTimeout( () =>{
            console.log('Pipeline is in queue. Waiting for build to start : ',jenkinsServer.jenkinsPipeline);
            loopUntilBuildStarts(jenkinsQueue, jenkinsServer, callback)
        }, 10*1000 );
    })

}

function checkIfJobStarted(jenkinsQueue, jenkinsServer, callback){
    const queueApiPath = jenkinsQueue.substring(jenkinsQueue.indexOf('/queue'))+'api/json'
    const apiMethod = 'GET';
    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol,jenkinsServer.jenkinsHostName,jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser,jenkinsServer.jenkinsToken)
        .callAPI(apiMethod,queueApiPath,{}, (err, data) => {
            if (err)
            {
                return callback(err, undefined);
            }
            const body = JSON.parse(data.body);
            if (body.executable && body.executable.number)
            {
                // job is started
                return callback(undefined, body.executable.number);
            }
            else {
                return callback(undefined, -1);

            }
        });
}


function loopUntilBuildFinishes(jenkinsServer, buildNo, callback){

    checkIfJobFinished(jenkinsServer, buildNo,(err, data) => {
        if (err) {return callback(err,undefined)}
        if (data)
        {
            console.log('Pipeline execution finished. Build No :', buildNo);
            if (data.result && data.result === 'ABORTED')
            {
                return callback(new Error('Pipeline was aborted!'));
            }
            return callback(undefined, data);
        }
        setTimeout( () =>{
            console.log('Checking pipeline execution status. Build No : ',jenkinsServer.jenkinsPipeline, buildNo);
            loopUntilBuildFinishes(jenkinsServer, buildNo, callback)
        }, 10*1000 );
    })

}


function checkIfJobFinished(jenkinsServer, buildNo, callback){
    // GET http://localhost:8090/job/initiateNetwork/11/api/json
    // json body :
    // "artifacts": [],
    //     "building": true,
    // loop until you get :
    //     "artifacts": [],
    //     "building": false,
    //      "result": "SUCCESS",
    // build is now finished and the result of the build is returned
    const buildApiPath = '/job/'+jenkinsServer.jenkinsPipeline+'/'+buildNo+'/api/json'
    const apiMethod = 'GET';
    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol,jenkinsServer.jenkinsHostName,jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser,jenkinsServer.jenkinsToken)
        .callAPI(apiMethod,buildApiPath,{}, (err, data) => {
            if (err)
            {
                return callback(err, undefined);
            }
            const body = JSON.parse(data.body);
            if (body.result === 'SUCCESS' || body.result === 'FAILURE' || body.result === 'ABORTED' || body.result === 'UNSTABLE')
            {
                let artifactFileNames = [];
                if (body.artifacts.length > 0){
                    //console.log(body);
                    body.artifacts.map(elem => artifactFileNames.push({
                        relativePath: elem.relativePath,
                        fileName: elem.fileName
                    }))
                }
                return callback(undefined, {
                    buildNo,
                    result: body.result,
                    jenkinsPipeline: jenkinsServer.jenkinsPipeline,
                    artifacts : artifactFileNames
                })
            } else {
                //build is in progress
                return callback(undefined)
            }

        });
}

function getArtefactProducedByJobAsText(jenkinsData, jenkinsServer, buildNo, buildApiPath, callback){
    const apiMethod = 'GET';
    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol,jenkinsServer.jenkinsHostName,jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser,jenkinsServer.jenkinsToken)
        .callAPI(apiMethod,buildApiPath,{},(err, data) => {
            if (err) {
                return callback(err, undefined);
            }
            return callback(undefined, data.body)
        })
}

function getJobConsoleLogAsText(jenkinsData, jenkinsServer, buildNo, callback){
    //http://localhost:8090/job/initiateNetwork/14/consoleText
    const buildApiPath = '/job/'+jenkinsServer.jenkinsPipeline+'/'+buildNo+'/consoleText'

    getArtefactProducedByJobAsText(jenkinsData, jenkinsServer, buildNo,buildApiPath, callback);

}

function getJobArtefactAsText(jenkinsData, jenkinsServer,artefactName, buildNo, callback){
    const buildApiPath = '/job/'+jenkinsServer.jenkinsPipeline+'/'+buildNo+'/artifact/'+artefactName;
    getArtefactProducedByJobAsText(jenkinsData, jenkinsServer, buildNo,buildApiPath, callback);
}

function getArtefactProducedByJob(jenkinsData, jenkinsServer, artefactName,buildNo, callback){
    //http://localhost:8090/job/gov-tests/38/artifact/privatesky/testReport.html
    const buildApiPath = '/job/'+jenkinsServer.jenkinsPipeline+'/'+buildNo+'/artifact/'+artefactName;
    const apiMethod = 'GET';
    console.log(buildApiPath);
    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol,jenkinsServer.jenkinsHostName,jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser,jenkinsServer.jenkinsToken)
        .callRawAPI(apiMethod,buildApiPath,{}, (err, response) => {
            if (err) {
                return callback(err, undefined);
            }
            return callback(undefined, response);
        });
}

function getBuildPipelineApiPath(jenkinsPipeline, useFormData = false) {
    if (useFormData) {
        return `/job/${jenkinsPipeline}/buildWithParameters?delay=0`;
    }

    return `/job/${jenkinsPipeline}/build?delay=0`;
}

function startPipeline(jenkinsServer, jenkinsPipeline, callback) {
    console.log('startPipeline : ', jenkinsPipeline);

    const apiPath = getBuildPipelineApiPath(jenkinsPipeline);
    const apiMethod = 'POST';
    jenkinsServer.jenkinsPipeline = jenkinsPipeline;

    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol, jenkinsServer.jenkinsHostName, jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser, jenkinsServer.jenkinsToken)
        .callAPI(apiMethod, apiPath, {}, (err, data) => {
            if (err) {
                return callback(err, undefined);
            }
            //console.log('data received from jenkins:',data);
            //console.log('jenkins job queue position :',data.headers.location);
            getJobExecutionStatus(data.headers.location, jenkinsServer, (err, data) => {
                if (err) {
                    console.log(err);
                    return callback(err, undefined);
                }
                //console.log(data)
                return callback(undefined, data);
            })

        });
}

function startParametrizedPipeline(jenkinsServer, jenkinsPipeline, pipelineParameters, callback) {
    console.log('startPipeline : ', jenkinsPipeline);
    const apiPath = getBuildPipelineApiPath(jenkinsPipeline, true);
    const apiMethod = 'POST';
    jenkinsServer.jenkinsPipeline = jenkinsPipeline;

    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol, jenkinsServer.jenkinsHostName, jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser, jenkinsServer.jenkinsToken)
        .setPipelineParametersFormData(pipelineParameters)
        .callAPI(apiMethod, apiPath, {}, (err, data) => {
            if (err) {
                return callback(err, undefined);
            }

            getJobExecutionStatus(data.headers.location, jenkinsServer, callback);
        });
}

function startPipelineWithFormDataFile(jenkinsServer,jenkinsPipeline, formDataFile, callback){
    console.log('startPipeline with file parameter : ',jenkinsPipeline);

    const apiPath = getBuildPipelineApiPath(jenkinsPipeline, true);
    const apiMethod = 'POST';
    jenkinsServer.jenkinsPipeline = jenkinsPipeline;

    require('./jenkinsRequest').getJenkinsHandler(jenkinsServer.jenkinsProtocol,jenkinsServer.jenkinsHostName,jenkinsServer.jenkinsPort)
        .setCredentials(jenkinsServer.jenkinsUser,jenkinsServer.jenkinsToken)
        .isFileMultipartFormData(formDataFile.content, formDataFile.fieldName, formDataFile.fileName)
        .callAPI(apiMethod,apiPath,{}, (err, data) => {
            if (err)
            {
                return callback(err, undefined);
            }
            //console.log('data received from jenkins:',data);
            //console.log('jenkins job queue position :',data.headers.location);
            getJobExecutionStatus(data.headers.location,jenkinsServer, (err, data)=>{
                if (err)
                {
                    console.log(err);
                    return callback(err, undefined);
                }
                //console.log(data)
                return callback(undefined, data);
            })

        });
}
module.exports = {
    startPipeline,
    startParametrizedPipeline,
    startPipelineWithFormDataFile,
    getArtefactProducedByJob,
    getJobConsoleLogAsText,
    getJobArtefactAsText
}
