var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var git = require('simple-git')();

var options = {
	build : './build/',
	src : './src/',
	ignore : true,
	remove_ignore : false,
	server : 'user@myserver.com',
	server_path : '/my/remote/path'
};
var sync_files = [];
var exception_files = [];

var methods = {
	sync : function () {
		console.log('sync: will sync the following', sync_files);
		
		var pathname = __dirname.replace(' ', '\\ ');
			pathname = path.normalize(pathname + '/' + options.build);
			
		var command = 'rsync -avz -e "ssh" ';
			command += pathname;
			command += ' ' + options.server + ':' + options.server_path;
		
		// log
		console.log('sync: command is: ', command);
		
		exec(command, function (err, stdout, stderr) {
			if (err) {
				console.log('sync: there was an error', err);
				console.log('sync: stderr:', stderr);
				return false;
			}
			console.log('sync: stdout:', stdout);
			console.log('sync: complete.');
		});
	},
	remove : function (pathname) {
		console.log('remove:', pathname);
		
		fs.unlink(pathname, function (err) {
			if (err) {
				console.log('remove: there was an error.', err);
				return;
			}
			
			options.removal_count++;
			
			if (options.removal_count === exception_files.length) {
				console.log('remove: complete');
				methods.sync();
			}
		});
	},
	is_directory : function(pathname) {
		fs.stat(pathname, function (err, stats) {
			if (err) {
				console.log('is_directory: there was an error.', err);
				return;
			}
			if (stats.isDirectory()) {
				console.log('is_directory: Please remove directory manually.', pathname);
				return;
			}
			methods.remove(pathname);
		});
	},
	clean : function () {
		console.log('clean:');
		
		options.removal_count = 0;
		for (var i = 0; i < exception_files.length; i++) {
			var file = exception_files[i];
			var pathname = options.build + file;
		
			console.log('clean:', pathname);
			
			methods.is_directory(pathname);
		}
	},
	check_ignore : function (pathname, file) {
		git.checkIgnore(pathname, function (err, results) {
			if (err) {
				console.log('clean: error checking ignore', err);
				return false;
			}
			if (!results.length) {
				sync_files.push(file);
			} else {
				exception_files.push(file);
			}
		});
	},
	check_directory : function () {
		fs.readdir(options.build, function (err, files) {
			if (err) {
				console.log('check_directory: error reading dir', err);
				return false;
			}
			var path_base = path.normalize(__dirname + '/' + options.src);
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				
				// simple check: it does not check within directories
				if (options.ignore) {
					methods.check_ignore(options.src + file, file);
				} else {
					sync_files.push(file);
				}
			}
			
			if (!options.ignore) {
				methods.sync();
				return;
			}
			
			git.then(function () {
				if (exception_files.length) {
					console.log('please make sure you have a clean build before continuing.', exception_files);
					if (options.remove_ignore) methods.clean();
					return;
				}
				methods.sync();
			});
		});
	}
};


gulp.task('clean-build', function () {
	var cmd = 'rm -rf build';
	exec(cmd);
	return gulp;
});
gulp.task('sync', function () {
	// kickoff the sync
	methods.check_directory();
	return gulp;
});
gulp.task('sync-b', ['clean-build', 'build', 'sync']);
