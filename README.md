# Simple SSH Client (ssshc)

ssshc - SSH client (remote login program) writted in Node.js with SSH2 library

## Installation

`npm install`

## Usage

`./ssshc [-L address] [-R address] [-i identity_file] destination`

Ex: `./ssshc -i ~/.ssh/id_rsa root@10.1.1.254`


## CLI arguments
Name | Format | Description
-----|--------|------------
destination|`[user[:password]@]hostname[:port]`|Connection endpoint
-L|`[bind_address:]port:host:hostport`|Specifies that connections to the given TCP port on the local (client) host are to be forwarded to the given host and port on the remote side.
-R|`[bind_address:]port:host:hostport`|Specifies that connections to the given TCP port on the remote (server) host are to be forwarded to the local side.
-i|`/path/to/id_file`|Selects a file from which the identity (private key) for public key authentication is read.
-v||Verbose mode. Causes ssshc to print debugging messages about its progress.  

## Host utils

### Usage

On the server, you must add the directory with scripts in PATH: `PATH=$PATH:/sss-simple-client/hostUtils/`

* `getFile $FROM $TO` - downloading file from ssh-server to client
* `putFile $FROM $TO` - uploading file from client to server

`$TO` can be omitted and by default it is `./`