export class Plugins {
  private _plugins: { [id: string]: any } = {};

  addPlugin(name: string, plugin: any) {
    if (this._plugins[name]) {
      throw new Error(`Plugin ${name} already added`);
    }
    this._plugins[name] = plugin;
  }

  getPlugin<T = any>(name: string): T {
    if (!this._plugins[name]) {
      throw new Error(`Plugin ${name} doesn't exist`);
    }
    return this._plugins[name];
  }
}
