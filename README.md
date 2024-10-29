# OpenAI Relay

[![Bun](https://img.shields.io/badge/Runtime-Bun-brightgreen)](https://bun.sh)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=flat&logo=kubernetes&logoColor=white)
![Helm](https://img.shields.io/badge/helm-%230F1689.svg?style=flat&logo=helm&logoColor=white)
[![Docker Pulls](https://img.shields.io/docker/pulls/yinheli/openai-relay)](https://hub.docker.com/r/yinheli/openai-relay)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![CI-Build](https://github.com/yinheli/openai-relay/actions/workflows/build.yaml/badge.svg?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Purpose

This project is a lightweight OpenAI API relay service built with Bun runtime that enables routing requests to different OpenAI-compatible backend services based on model prefixes. It features seamless integration with Kubernetes through Helm charts for easy deployment and scaling.

## Features

- 🚀 Built with Bun runtime
- 🔄 Compatible with OpenAI API specification
- 🎮 Easy configuration through environment variables
- 🚢 Kubernetes deployment support with Helm charts

## Installation

### Using Helm Charts

1. **Add the Helm repository**:
   ```bash
   helm repo add openai-relay https://yinheli.github.io/openai-relay
   ```

2. **Update your Helm repositories**:
   ```bash
   helm repo update
   ```

3. **Install the chart**:
   ```bash
   helm install openai-relay openai-relay/openai-relay
   ```

4. **Configuration**:
   You can customize the installation by providing a `values.yaml` file. Below are the default values you can override:

   ```yaml
   replicaCount: 1

   image:
     repository: yinheli/openai-relay
     pullPolicy: IfNotPresent
     tag: ""

   service:
     type: ClusterIP
     port: 80

   ingress:
     enabled: false
     hosts:
       - host: chart-example.local
         paths:
           - path: /
             pathType: ImplementationSpecific

   resources: {}

   # environment variables
   envVars:
     RELAY_PROVIDER_SILICONCLOUD: https://api.siliconflow.cn
     RELAY_MODEL_SILICONCLOUD: siliconcloud-gpt-4o,siliconcloud-gpt-4o-mini
     RELAY_API_KEY_SILICONCLOUD: sk-siliconcloud-api-key
   ```

5. **Accessing the Service**:
   Once installed, you can access the service through the specified service type and port.

For more detailed configuration options, refer to the `values.yaml` and `config.ts` file in the repository.

### Using Docker

You can run the OpenAI Relay service using Docker:

```bash
docker run -d \
  --name openai-relay \
  -e RELAY_PROVIDER_SILICONCLOUD=https://api.siliconflow.cn \
  -e RELAY_MODEL_SILICONCLOUD=siliconcloud-gpt-4o,siliconcloud-gpt-4o-mini \
  -e RELAY_API_KEY_SILICONCLOUD=sk-siliconcloud-api-key \
  -p 80:80 \
  yinheli/openai-relay:latest
```

> [!NOTE]
> You can customize the environment variables to fit your needs. and pay attention to the docker image tag, you may need to replace it with the release tag.


## Contributors

![Contributors](https://contrib.rocks/image?repo=yinheli/openai-relay)


## Contributing

We welcome contributions to improve the OpenAI Relay service. Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit improvements and bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
