"use strict";

var util = require('util');
var debug = require('debug')('asd');
var semver = require('semver');
var GitHub = require('github');
var request = require('request');
var unzip = require('node-unzip-2');
var fs = require('fs-extra');
var minimatch = require('minimatch');
var path = require('path');

var re_arch = /^atom-shell-[^-]+-(\w+)-(\w+).*$/;

function parseName(name) {
	var match = name.match(re_arch);
	if (match) {
		return {
			os: match[1],
			arch: match[2]
		};
	}
	return null;
}

function Release(release) {
	this.name = release.name;
	this.version = release.tag_name;
	this.prerelease = release.prerelease;

	var dists = this.dists = {};
	release.assets.forEach(function(asset) {
		var arch = parseName(asset.name);
		if (!arch) return;

		var dist = {
			name: asset.name,
			url: asset.browser_download_url,
			size: asset.size,
			os: arch && arch.os,
			arch: arch && arch.arch,
			download: function() {
				debug('download: ' + this.name);
				return request(dist.url);
			},
			extract: function(dest, options) {
				options = options || {};
				var filter = options.filter || [];
				if (!Array.isArray(filter)) {
					filter = [filter];
				}
				dest = dest || '.';

				debug('extract: %s -> %s', this.name, dest);

				// ensure that destination exists
				fs.ensureDirSync(dest);

				var stream = this.download();
				var zip = stream.pipe(unzip.Parse());
				zip.on('entry', function(entry) {
					// skip directories
					if (entry.type === 'Directory') {
						entry.autodrain();
						return;
					}

					var dest_file = path.join(dest, entry.path);
					// skip if path is filtered
					for (var i in filter) {
						if (minimatch(entry.path, filter[i], {dot: true})) {
							debug('  skip: %s', entry.path);
							entry.autodrain();
							return;
						}
					}
					debug('  write: %s -> %s', entry.path, dest_file);
					fs.ensureFileSync(dest_file);
					if (entry.path == 'atom') {
						// make 'atom' executable
						fs.chmodSync(dest_file, '755');
					}
					entry.pipe(fs.createWriteStream(dest_file));
				});
				return stream;
			}
		};
		dists[arch.os + '-' + arch.arch] = dist;
	});
}

var Downloader = module.exports = {};

function fetchAll(cb) {
	debug('fetch all');
	var github = new GitHub({
		version: '3.0.0',
		timeout: 5000
	});
	github.releases.listReleases({
		owner: 'atom',
		repo: 'atom-shell'
	}, function(err, results) {
		if (err) return cb(err);
		cb(null, results);
	});
}

// Fetch all Atom-Shell releases
Downloader.all = function(version, cb) {
	version = version || '*';
	if (typeof version === 'function') {
		cb = version;
		version = '*';
	}

	fetchAll(function(err, results) {
		if (err) return cb(err);

		results = results.filter(function(res) {
			return semver.satisfies(res.tag_name, version);
		});

		cb(null, results.map(function(res) {
			return new Release(res);
		}));
	});
};

Downloader.latest = function(version, cb) {
	version = version || '*';
	if (typeof version === 'function') {
		cb = version;
		version = '*';
	}

	fetchAll(function(err, releases) {
		if (err) return cb(err);

		var versions = releases.map(function(release) {
			return release.tag_name;
		});

		var latest = semver.maxSatisfying(versions, version);
		for (var i in releases) {
			if (releases[i].tag_name == latest) {
				debug('latest: %s', releases[i].name);
				return cb(null, new Release(releases[i]));
			}
		}
		// no latest found...
		cb(null);
	});
};
