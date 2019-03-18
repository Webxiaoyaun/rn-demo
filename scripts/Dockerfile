#############################
# Dockerfile for JDReact SDK
#############################

# ——————————
# Pull base image
# ——————————
FROM ubuntu:14.04

# ——————————
# Install base software packages
# ——————————
RUN apt-get update && \
    apt-get install software-properties-common \
    python-software-properties \
    wget \
    curl \
    git \
    unzip -y && \
    apt-get clean

# ——————————
# Install Node and global packages
# ——————————
ENV NODE_VERSION 6.9.5
RUN cd && \
    wget -q http://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz && \
    tar -xzf node-v${NODE_VERSION}-linux-x64.tar.gz && \
    mv node-v${NODE_VERSION}-linux-x64 /opt/node && \
    rm node-v${NODE_VERSION}-linux-x64.tar.gz
ENV PATH ${PATH}:/opt/node/bin

# ——————————
# add new user
# ——————————
RUN useradd -ms /bin/bash jdreact

# ——————————
# Install Basic JDReact packages
# ——————————
USER jdreact
RUN npm config set registry http://registry.m.jd.com/
USER root

# ——————————
# Set the locale
# ——————————
RUN locale-gen en_US.UTF-8  
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8     
