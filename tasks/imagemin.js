const os = require('os');
const chalk = require('chalk');
const plur = require('plur');
const prettyBytes = require('pretty-bytes');

const defaultPlugins = ['gifsicle', 'jpegtran', 'optipng', 'svgo/index.js'];

const loadPlugin = async (grunt, plugin, options) => {
	try {
		/* eslint-disable node/no-unsupported-features/es-syntax */
		const module = await import(`imagemin-${plugin}`);
		if ('default' in module) {
			return module.default(options);
		}

		return module(options);
		/* eslint-enable node/no-unsupported-features/es-syntax */
	} catch {
		grunt.warn(`Couldn't load default plugin "${plugin}"`);
	}
};

const getDefaultPlugins = async (grunt, options) => {
	const loadingPromises = defaultPlugins.map(plugin => loadPlugin(grunt, plugin, options));
	const instances = await Promise.all(loadingPromises);
	const plugins = instances.filter(instance => Boolean(instance));
	return plugins;
};

module.exports = grunt => {
	grunt.registerMultiTask('imagemin', 'Minify PNG, JPEG, GIF and SVG images', function () {
		const done = this.async();
		const options = this.options({
			interlaced: true,
			optimizationLevel: 3,
			progressive: true,
			concurrency: os.cpus().length,
		});

		if (Array.isArray(options.svgoPlugins)) {
			options.plugins = options.svgoPlugins;
		}

		const pluginsPromise = options.use
			? Promise.resolve(options.use)
			: getDefaultPlugins(grunt, options);
		/* eslint-disable node/no-unsupported-features/es-syntax */
		const imageminPromise = import('imagemin')
			.then(imagemin => imagemin.default);
		const pMapPromise = import('p-map')
			.then(pMap => pMap.default);
		/* eslint-enable node/no-unsupported-features/es-syntax */

		Promise.all([pluginsPromise, imageminPromise, pMapPromise]).then(([plugins, imagemin, pMap]) => {
			let totalBytes = 0;
			let totalSavedBytes = 0;
			let totalFiles = 0;

			const processFile = file => Promise.resolve(grunt.file.read(file.src[0], {encoding: null}))
				.then(buf => Promise.all([imagemin.buffer(buf, {plugins}), buf]))
				.then(([optimizedBuf, originalBuf]) => {
					const originalSize = originalBuf.length;
					const optimizedSize = optimizedBuf.length;
					const saved = originalSize - optimizedSize;
					const percent = originalSize > 0 ? (saved / originalSize) * 100 : 0;
					const savedMessage = `saved ${prettyBytes(saved)} - ${percent.toFixed(1).replace(/\.0$/, '')}%`;
					const message = saved > 0 ? savedMessage : 'already optimized';

					if (saved > 0) {
						totalBytes += originalSize;
						totalSavedBytes += saved;
						totalFiles++;
					}

					grunt.file.write(file.dest, optimizedBuf);
					grunt.verbose.writeln(chalk.green('✔ ') + file.src[0] + chalk.gray(` (${message})`));
				})
				.catch(error => {
					grunt.warn(`${error} in file ${file.src[0]}`);
				});

			pMap(this.files, processFile, {concurrency: options.concurrency}).then(() => {
				const percent = totalBytes > 0 ? (totalSavedBytes / totalBytes) * 100 : 0;
				let message = `Minified ${totalFiles} ${plur('image', totalFiles)}`;

				if (totalFiles > 0) {
					message += chalk.gray(` (saved ${prettyBytes(totalSavedBytes)} - ${percent.toFixed(1).replace(/\.0$/, '')}%)`);
				}

				grunt.log.writeln(message);
				done();
			});
		});
	});
};
