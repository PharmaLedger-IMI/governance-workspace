

echo "Build Jenkins Agents"
echo "Building kubectl jenkins agent docker image"

docker build --no-cache -t pharmaledger-kubectl-jenkins-agent:1.0 -f ./jenkins/docker/kubectl/Dockerfile .
docker tag pharmaledger-kubectl-jenkins-agent:1.0 public.ecr.aws/n4q1q0z2/pharmaledger-kubectl-jenkins-agent:1.0
docker push public.ecr.aws/n4q1q0z2/pharmaledger-kubectl-jenkins-agent:1.0

echo "Finished Build kubectl jenkins agent docker image"


echo "Building docker-aws jenkins agent docker image"

docker build --no-cache -t pharmaledger-docker-aws-jenkins-agent:1.0 -f ./jenkins/docker/docker-aws/Dockerfile .
docker tag pharmaledger-docker-aws-jenkins-agent:1.0 public.ecr.aws/n4q1q0z2/pharmaledger-docker-aws-jenkins-agent:1.0
docker push public.ecr.aws/n4q1q0z2/pharmaledger-docker-aws-jenkins-agent:1.0

echo "Finished Build docker-aws jenkins agent docker image"
