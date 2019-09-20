FROM fedora:latest

RUN dnf install git java-latest-openjdk-headless nodejs -y \
    && dnf clean all \
    && npm install -g eslint serverless
