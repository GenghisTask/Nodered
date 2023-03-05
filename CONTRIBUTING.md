# Contributing
   
All valuable ressource will be added in this file in order to know how to extend the nodered software with a plugin.
 

Create a new node
==========

https://nodered.org/docs/creating-nodes/first-node
https://nodered.org/docs/creating-nodes/config-nodes


Communication with the server
==========

Example of the ajax request "/serialports"

https://discourse.nodered.org/t/add-dynamically-data-to-node-configuration/25624/5
https://github.com/node-red/node-red-nodes/blob/master/io/serialport/25-serial.html
https://github.com/node-red/node-red-nodes/blob/master/io/serialport/25-serial.js


Example of node executing unix command
==========

node_modules/@node-red/nodes/core/function/90-exec.js


Handling sensitive information
==========
https://nodered.org/docs/creating-nodes/credentials
https://github.com/node-red/node-red-nodes/blob/master/social/email/61-email.js#L227


Create a new frontend
==========

Ui api https://nodered.org/docs/api/ui/treeList/


SSH configuration
==========

Custom identity ```ssh -i identity_file```
Source : https://superuser.com/questions/124101/run-a-remote-command-using-ssh-config-file

Custom remote command

```
RequestTTY yes
RemoteCommand screen -UDr
```

SSh tunnel
Source: https://unix.stackexchange.com/questions/234903/correct-ssh-config-file-settings-to-tunnel-to-a-3rd-machine

```
Host server1
  Hostname server1.example.com
  IdentityFile ~/.ssh/id_rs

Host server2_behind_server1
  Hostname server2.example.com
  IdentityFile ~/.ssh/id_rsa
  ProxyJump server1
```


Node output
==========

https://github.com/node-red/node-red-nodes/tree/master/utility/daemon

Nodered inheritance
==========

```
        const registry = require('@node-red/registry')
        registry.get("exec").bind(this)(config);
```

Kubernetes
==========

https://kubernetes.io/docs/reference/kubectl/cheatsheet/



Release
==========

```
npm pack
```