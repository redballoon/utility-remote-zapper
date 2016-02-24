# utility-remote-zapper
Gulp task to synchronize build files with a remote server.

Uses rsync with ssh.

Does a simple dumb-down check for ignored files and bails out if it finds any.

## Dependencies
simple-git

## Option Defaults:
Within the file you can set an options object that will be used during the task.

build: './build/'

src: './src/'

ignore: true

remove_ignore: false

server: 'user@myserver.com'

server_path: '/my/remote/path'


####ignore
set to false if you don't want to check if files are being ignored by git.

####remove_ignore
set to true to remove the ignored files before syncing but only if its files, it will still bail out if it finds ignored directories.


