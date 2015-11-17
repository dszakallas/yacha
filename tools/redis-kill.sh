#!/usr/bin/env sh

cd tools/redis
docker-compose kill redis
docker-compose rm redis