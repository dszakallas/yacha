#!/bin/sh

if [ ! -f .bin/selenium-server-standalone.jar ]
then
    mkdir -p .bin
    curl http://selenium-release.storage.googleapis.com/2.47/selenium-server-standalone-2.47.1.jar -o .bin/selenium-server-standalone.jar
fi



