import {Config} from '@remotion/cli/config';

// Required for port forwarding out of the devcontainer to the Windows browser.
Config.setIPv4(true);

// Remotion caches Chrome Headless Shell per project (node_modules/.remotion),
// so without this every project downloads its own 220 MB copy. The devcontainer
// image ships one shared copy and points REMOTION_CHROME at it.
if (process.env.REMOTION_CHROME) {
	Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}

// Components in the linked @harness/visuals package are reached through a
// symlink. Webpack resolves symlinks to their real path by default, so their
// imports would be looked up next to the package instead of in this project's
// node_modules. Keeping the symlink path lets them use every dependency the
// project has, and matches tsconfig's preserveSymlinks.
Config.overrideWebpackConfig((config) => ({
	...config,
	resolve: {...config.resolve, symlinks: false},
}));
