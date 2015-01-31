# Atom-Shell Downloader

Download and extract latest or specific version of Atom-Shell.

## Install

	npm install -g atom-shell-downloader

## Usage

	atom-shell-downloader <operation> [options] [version range]
	
Available operations:
	
	`-h`: Show help
	`-v`: Show version
	
	`-l`: List available versions
	`-d`: Download Atom-Shell release
	`-x`: Download and extract Atom-Shell to folder

Additional options:
	
	`-p`: Show progress
	`-o <path>`: Output file/directory
	`--platform <platform>`: Select platform (linux, win32, darwin)
	`--arch <arch>`: Select architecture (ia32, x64)
	`-f <filepath>`: Skip specific filepath when extracting

Platform and architecture are automatically selected from the system if not specified.

List, download and extract operations support Atom-Shell version selection with [semver](https://github.com/npm/node-semver) syntax

List all available v0.20.x versions

	atom-shell-downloader -l v0.20

Download latest Atom-Shell v0.20.x version

	atom-shell-downloader -d -p v0.20

Download and extract latest Atom-Shell to './atom-shell' (default) folder

	atom-shell-downloader -x -p

Download and extract to specific folder

	atom-shell-downloader -x -o /some/random/path
