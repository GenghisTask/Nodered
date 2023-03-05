
# Change Log
All notable changes to this project will be documented in this file.
 
 
## [1.0.0] - 2023-02-18


- declaration of new config-node workspace
-  > git clone a config.workspace into a folder config.id
-  > manage git urls of a workspace containing scripts and environment under version control
-  > manage a deploy token config for protected depot
- declaration of new config-node ssh keys
-  > manage ssh key, check existing keys
- declaration of new function-node genghistask
-  > configure the node name
-  > configure a node by selecting one git url of a workspace
-  > configure a node by selecting one environment with autocomplete based on ajax /genghistask-environment
-  >> open route /genghistask-environment to get environment based on workspace content
-  >>> generate a list of possible host to ssh to by reading local file data/api/environment/ssh/config
-  >>> generate a list of possible containers to run by reading local file data/api/environment/docker/docker-compose.yml
-  > configure a node by selecting one script with autocomplete based on ajax /genghistask-script
-  >> open route /genghistask-script to get environment based on workspace content
-  >>> generate a list of exectuable scripts inside the local directory data/api/shell
-  > implement node behavoir on input
-  >> instead of running a command locally you can prefix a ssh connection to run the same command on a host
-  >> instead of running a command locally you can prefix a docker run command to run the same command on a containers
-  >> instead of running a command locally you can prefix a docker exec command to run the same command on a running containers
- declaration of dependancies package