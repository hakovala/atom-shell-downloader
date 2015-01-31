#!/usr/bin/env node

var Downloader = require('../index.js');

var os = require('os');
var fs = require('fs-extra');
var path = require('path');
var debug = require('debug')('asd:cli'); 
var ProgressBar = require('progress');

var pkg = require('../package.json');
var program = require('commander');
program
	.version(pkg.version)
	.usage('<operation> [options] [version range]')
	.option('-d --download', 'download atom-shell')
	.option('-x --extract', 'download and extract atom-shell')
	.option('-l --list', 'list all atom-shell versions')
	.option('-o --output [file/dir]', 'output file/directory')
	.option('--platform [platform]', 'platform ie. linux, win32, darwin')
	.option('--arch [arch]', 'system architecture ie. ia32, x64')
	.option('-f --filter [filepath]', 'filter out matching filepaths', [])
	.option('-p --progress', 'show progress')
	.parse(process.argv);

var output = program.output;

var version = program.args[0];
var platform = program.platform || os.platform();
var arch = program.arch || os.arch();

debug('output: %s', output);
debug('version: %s', version);
debug('platform: %s', platform);
debug('arch: %s', arch);

function download(name, stream) {
	if (program.progress) {
		var progress;
		stream.on('data', function(chunk) {
			progress = progress || new ProgressBar(name + ' [:bar] :percent :etas', {
				complete: '=',
				incomplete: ' ',
				width: 25,
				total: parseInt(stream.response.headers['content-length'])
			});

			progress.tick(chunk.length);
		});
		stream.on('close', function() {
			progress.tick(progress.total - progress.curr);
		});
	}

	return stream;
}

if (program.download) {
	debug('operation: download');
	Downloader.latest(version, function(err, latest) {
		if (err) throw err;
		var dist = latest.dists[platform + '-' + arch];
		var filename = output || '.';
		try {
			if (fs.lstatSync(filename).isDirectory()) {
				filename = path.join(filename, dist.name);
			}
		} catch(e) {}
		fs.ensureFileSync(filename);
		download(dist.name, dist.download()).pipe(fs.createWriteStream(filename));
	});
} else if (program.extract) {
	debug('operation: extract');
	Downloader.latest(version, function(err, latest) {
		if (err) throw err;
		var dist = latest.dists[platform + '-' + arch];
		output = output || 'atom-shell';
		download(dist.name, dist.extract(output, {
			filter: program.filter
		}));
	});
} else if (program.list) {
	debug('operation: list');
	Downloader.all(version, function(err, releases) {
		if (err) throw err;
		releases.forEach(function(release) {
			console.log(release.version);
		});
	});
} else {
	console.log('Missing operation argument');
	program.help();
}

