FROM ubuntu:25.10

ARG GO_VERSION=1.25.2
ARG NODE_VERSION=24

# Install dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y ca-certificates bash-completion build-essential curl git locales make tar tzdata && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Run as non-root user
USER ubuntu
WORKDIR /home/ubuntu

RUN mkdir -p /home/ubuntu/bin
ENV PATH="/home/ubuntu/bin:${PATH}"

# Install Go
RUN curl -L -O https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
    tar -C /home/ubuntu/bin -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz && \
    /home/ubuntu/bin/go/bin/go install github.com/air-verse/air@latest
ENV PATH="/home/ubuntu/go/bin:/home/ubuntu/bin/go/bin:${PATH}"

# Install Node.js
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
ENV NVM_DIR=/home/ubuntu/.nvm
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && corepack enable pnpm && corepack install -g pnpm"

# Set the working directory
WORKDIR /workspace