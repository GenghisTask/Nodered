GenghisTask - Node Red
==========

This node-red plugin is an improvement of the exec plugin.

- task can be executed in a remote server
- task can be executed within a docker container
- supply extra argument to executable
- call a script instead of exec a command

GenghisTask was a standalone application but you may prefer Node Red instead. This plugin allow you to use the concept and convention of a "GenghisTask Workspace" in Node Red without GenghisTask at all.


Install
==========

Suggested node red startup with docker

```
mkdir nodered
cd nodered
docker run -d -it -e HOSTDIR=`pwd` -p 1880:1880  -v /var/run/docker.sock:/var/run/docker.sock  -v `pwd`/data:/data -v `pwd`/ssh:/usr/src/node-red/.ssh --name mynodered nodered/node-red

```

|   |   |   |   |   |
|---|---|---|---|---|
| -v  |  /var/run/docker.sock |  /var/run/docker.sock |   |   |
| -v  |  `pwd`/data |  /data |   |   |
|  -v | `pwd`/ssh  |  /usr/src/node-red/.ssh |   |   |
|  -e | HOSTDIR  |  `pwd` |   |   |


Install the [➡️ lattest release](https://github.com/GenghisTask/node-red/releases) in the node red Managed palette.

Running with ssh
==========

In the node red settings, you can get the ssh key public key of node red to execute task remotely or clone a workspace from a protected repository


Running docker inside docker
==========

The default nodered image does not contains docker. You may install the docker client to be able to execute task within a docker container.


```
echo "apk add --update --no-cache docker-cli  docker-compose" | docker exec -uroot -i mynodered sh
docker exec -uroot mynodered addgroup docker -g `grep docker /etc/group | cut -d : -f 3`
docker exec -uroot mynodered addgroup node-red docker
docker restart mynodered
```

Cron
==========

A task can be trigger manually with its input button in nodered. I also use third party extension node-red-contrib-cron-plus.


Workspace
==========

You must use a remote git repository where the source code of each task will be under version control.

The repository contains an ```environement``` folder and a ```shell``` folder. They define a list of ssh server, docker images and shell script to execute.

You can start to create a typical  [➡️  workspace here](https://github.com/GenghisTask/Workspace/fork).
