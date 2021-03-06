podTemplate(serviceAccount: 'jgovmns',namespace: 'jenkins',containers: [
  containerTemplate(name: 'kubectl', image: 'mabdockerid/pharma-kubectl:latest', command: 'cat', ttyEnabled: true)
],
volumes: [
  hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')
]){
  node(POD_LABEL) {
    stage('Deploy Governance') {
        stage('Get deployment'){
        git url: 'https://github.com/PharmaLedger-IMI/governance-workspace.git'
        }

        container('kubectl') {
            stage('Deploy Governance SSAPP'){
                sh 'kubectl apply -f docker/k8s -n gov && sleep 3'
            }
            stage('Get deployment status'){
                sh "kubectl get pods -n gov"
            }
        }
    }
  }
}
