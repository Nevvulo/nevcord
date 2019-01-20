const { resolve } = require('path');
const { readdirSync } = require('fs');
const { getOwnerInstance, asyncArray: { filter, forEach } } = require('powercord/util');

module.exports = class PluginManager {
  constructor () {
    this._requiresReload = false;
    this.pluginDir = resolve(__dirname, 'plugins');
    this.ensuredPlugins = [];

    this.manifestKeys = [ 'name', 'version', 'description', 'author', 'license', 'repo' ];
    this.enforcedPlugins = [ 'pc-styleManager', 'pc-settings', 'pc-pluginManager', 'pc-keybindManager' ];
  }

  get requiresReload () {
    return this._requiresReload;
  }

  set requiresReload (value) {
    this._requiresReload = value;
    const title = document.querySelector('.pc-titleWrapper');
    if (title) {
      getOwnerInstance(title).forceUpdate();
    }
  }

  // Getters
  get (plugin) {
    return this.plugins.get(plugin);
  }

  async getPluginName (pluginID) {
    const plugin = this.get(pluginID);
    if (plugin) {
      return plugin.manifest.name;
    }
    // API request
    return 'uuuuuuh';
  }

  getPlugins () {
    return Array.from(this.plugins.keys()).filter(p => !powercord.settings.get('hiddenPlugins', []).includes(p));
  }

  getHiddenPlugins () {
    return Array.from(this.plugins.keys()).filter(p => powercord.settings.get('hiddenPlugins', []).includes(p));
  }

  getAllPlugins () {
    return Array.from(this.plugins.keys());
  }

  isEnabled (plugin) {
    return !powercord.settings.get('disabledPlugins', []).includes(plugin);
  }

  isEnforced (plugin, iterate = true) {
    if (this.enforcedPlugins.includes(plugin)) {
      return true;
    }

    if (!iterate) {
      return false;
    }

    const dependents = this.resolveDependentsSync(plugin);
    return dependents.filter(p => this.isEnforced(p, false)).length !== 0;
  }

  // Resolvers
  async resolveDependencies (plugin, deps = []) {
    const dependencies = await this.getDependencies(plugin);

    await forEach(dependencies, async dep => {
      if (!deps.includes(dep)) {
        deps.push(dep);
        deps.push(...(await this.resolveDependencies(dep, deps)));
      }
    });
    return deps.filter((d, p) => deps.indexOf(d) === p);
  }

  async resolveDependents (plugin, dept = []) {
    const dependents = await filter(this.getAllPlugins(), async p => (await this.getDependencies(p)).includes(plugin));
    await forEach(dependents, async dpt => {
      if (!dept.includes(dpt)) {
        dept.push(dpt);
        dept.push(...(await this.resolveDependents(dpt, dept)));
      }
    });
    return dept.filter((d, p) => dept.indexOf(d) === p);
  }

  async getDependencies (plugin) {
    if (plugin.startsWith('pc-')) {
      return this.get(plugin).manifest.dependencies;
    }
    // request to API
    return [];
  }

  resolveDependentsSync (plugin, dept = []) {
    const dependents = this.getAllPlugins().filter(p => (this.getDependenciesSync(p)).includes(plugin));
    dependents.forEach(dpt => {
      if (!dept.includes(dpt)) {
        dept.push(dpt);
        dept.push(...(this.resolveDependentsSync(dpt, dept)));
      }
    });
    return dept.filter((d, p) => dept.indexOf(d) === p);
  }

  getDependenciesSync (plugin) {
    if (plugin.startsWith('pc-')) {
      return this.get(plugin).manifest.dependencies;
    }
    // Just return empty array
    return [];
  }

  // Load/enable/install/hide shit
  load (pluginID) {
    const plugin = this.get(pluginID);
    if (!plugin) {
      throw new Error(`Tried to load a non installed plugin (${plugin})`);
    }
    if (plugin.ready) {
      throw new Error(`Tried to load an already loaded plugin (${plugin})`);
    }

    plugin._start();
  }

  unload (pluginID) {
    const plugin = this.get(pluginID);
    if (!plugin) {
      throw new Error(`Tried to unload a non installed plugin (${plugin})`);
    }
    if (!plugin.ready) {
      throw new Error(`Tried to unload a non loaded plugin (${plugin})`);
    }

    plugin._unload();
  }

  show (plugin) {
    powercord.settings.set(
      'hiddenPlugins',
      powercord.settings.get('hiddenPlugins', []).filter(p => p !== plugin)
    );
  }

  hide (plugin) {
    const disabled = powercord.settings.get('hiddenPlugins', []);
    disabled.push(plugin);
    powercord.settings.set('hiddenPlugins', disabled);
  }

  enable (pluginID) {
    if (!this.get(pluginID)) {
      throw new Error(`Tried to unload a non installed plugin (${pluginID})`);
    }

    powercord.settings.set(
      'disabledPlugins',
      powercord.settings.get('disabledPlugins', []).filter(p => p !== pluginID)
    );

    this.load(pluginID);
  }

  disable (pluginID) {
    const plugin = this.get(pluginID);

    if (!plugin) {
      throw new Error(`Tried to unload a non installed plugin (${pluginID})`);
    }
    if (this.enforcedPlugins.includes(pluginID)) {
      throw new Error(`You cannot disable an enforced plugin. (Tried to disable ${pluginID})`);
    }
    powercord.settings.set('disabledPlugins', [
      ...powercord.settings.get('disabledPlugins', []),
      pluginID
    ]);

    if (plugin.manifest.hotReload) {
      this.unload(pluginID);
    } else {
      this.requiresReload = true;
    }
  }

  install (plugin) {
    this.requiresReload = true;
    console.log('soon:tm:');
  }

  uninstall (plugin) {
    if (this.enforcedPlugins.includes(plugin)) {
      throw new Error(`You cannot uninstall an enforced plugin. (Tried to uninstall ${plugin})`);
    }

    if (plugin.startsWith('pc-')) {
      throw new Error(`You cannot uninstall an internal plugin. (Tried to uninstall ${plugin})`);
    }

    this.requiresReload = true;
    console.log('soon:tm:');
  }

  // Start + internals
  startPlugins () {
    this._loadPlugins();
    for (const plugin of [ ...this.plugins.values() ]) {
      if (powercord.settings.get('disabledPlugins', []).includes(plugin.pluginID)) {
        continue;
      }
      if (
        (plugin.manifest.appMode === 'overlay' && window.__OVERLAY__) ||
        (plugin.manifest.appMode === 'app' && !window.__OVERLAY__) ||
        plugin.manifest.appMode === 'both'
      ) {
        this.load(plugin.pluginID);
      } else {
        console.error('%c[Powercord]', 'color: #257dd4', `Plugin ${plugin.constructor.name} doesn't have a valid app mode - Skipping`);
        this.plugins.delete(plugin);
      }
    }
  }

  ensureDepEnabled (plugin, ensured = []) {
    if (!ensured.includes(plugin)) { // Prevent cyclic loops
      ensured.push(plugin);
      plugin.manifest.dependencies.forEach(dep => {
        this.enable(dep);
        this.ensureDepEnabled(dep, ensured);
      });
    }
  }

  _loadPlugins () {
    const plugins = {};
    readdirSync(this.pluginDir)
      .forEach(filename => {
        const moduleName = filename.split('.')[0];

        let manifest;
        try {
          manifest = Object.assign({
            appMode: 'app',
            dependencies: [],
            hotReload: true
          }, require(resolve(this.pluginDir, filename, 'manifest.json')));
        } catch (e) {
          return console.error('%c[Powercord]', 'color: #257dd4', `Plugin ${moduleName} doesn't have a valid manifest - Skipping`);
        }

        if (!this.manifestKeys.every(key => manifest.hasOwnProperty(key))) {
          return console.error('%c[Powercord]', 'color: #257dd4', `Plugin "${moduleName}" doesn't have a valid manifest - Skipping`);
        }

        try {
          const PluginClass = require(resolve(this.pluginDir, filename));

          Object.defineProperties(PluginClass.prototype, {
            pluginID: {
              get: () => moduleName,
              set: () => {
                throw new Error('Plugins cannot update their ID at runtime!');
              }
            },
            manifest: {
              get: () => manifest,
              set: () => {
                throw new Error('Plugins cannot update manifest at runtime!');
              }
            }
          });

          plugins[moduleName] = new PluginClass();
        } catch (e) {
          console.error('%c[Powercord]', 'color: #257dd4', `An error occurred while initializing "${moduleName}"!`, e);
        }
      });

    this.plugins = new Map(Object.entries(plugins));
  }
};
