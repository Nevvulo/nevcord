const { resolve } = require('path');
const { readdirSync } = require('fs');

const manifestKeys = [ 'name', 'version', 'description', 'author', 'license', 'repo' ];

module.exports = class PluginManager {
  constructor () {
    this.requiresReload = false;
    this.pluginDir = resolve(__dirname, 'plugins');
  }

  get (plugin) {
    return this.plugins.get(plugin);
  }

  enable (plugin) {
    this.requiresReload = true;
    powercord.settingsManager.set(
      'disabledPlugins',
      powercord.settingsManager.get('disabledPlugins', []).filter(p => p !== plugin)
    );
  }

  disable (plugin) {
    this.requiresReload = true;
    const disabled = powercord.settingsManager.get('disabledPlugins', []);
    disabled.push(plugin);
    powercord.settingsManager.set('disabledPlugins', disabled);
  }

  startPlugins () {
    this._loadPlugins();
    for (const plugin of [ ...this.plugins.values() ]) {
      if (
        (plugin.options.appMode === 'overlay' && window.__OVERLAY__) ||
        (plugin.options.appMode === 'app' && !window.__OVERLAY__) ||
        plugin.options.appMode === 'both'
      ) {
        plugin._start();
      } else {
        console.error('%c[Powercord]', 'color: #257dd4', `Plugin ${plugin.constructor.name} doesn't have a valid app mode - Skipping`);
        this.plugins.delete(plugin);
      }
    }
  }

  _loadPlugins () {
    const plugins = {};
    readdirSync(this.pluginDir)
      .forEach(filename => {
        const moduleName = filename.split('.')[0];
        if (powercord.settingsManager.get('disabledPlugins', []).includes(moduleName)) {
          return;
        }

        let manifest;
        try {
          manifest = require(resolve(this.pluginDir, filename, 'manifest.json'));
        } catch (e) {
          return console.error('%c[Powercord]', 'color: #257dd4', `Plugin ${moduleName} doesn't have a valid manifest - Skipping`);
        }

        if (!manifestKeys.every(key => manifest.hasOwnProperty(key))) {
          return console.error('%c[Powercord]', 'color: #257dd4', `Plugin "${moduleName}" doesn't have a valid manifest - Skipping`);
        }

        try {
          const PluginClass = require(resolve(this.pluginDir, filename));
          const plugin = new PluginClass();
          Object.defineProperty(plugin, 'pluginID', {
            get () {
              return moduleName;
            },
            set () {
              throw new Error('Plugins cannot update their id at runtime!');
            }
          });
          Object.defineProperty(plugin, 'manifest', {
            get () {
              return manifest;
            },
            set () {
              throw new Error('Plugins cannot update manifest at runtime!');
            }
          });

          plugins[moduleName] = plugin;
        } catch (e) {
          console.error('%c[Powercord]', 'color: #257dd4', `An error occurred while initializing "${moduleName}"!`, e);
        }
      });

    this.plugins = new Map(Object.entries(plugins));
  }
};
