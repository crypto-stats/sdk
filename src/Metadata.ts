export class Metadata {
  private metadata: { [key: string]: any };

  constructor(metadata: { [key: string]: any }) {
    this.metadata = metadata;
  }

  async getMetadata() {
    const metadata = { ...this.metadata };

    await Promise.all(Object.entries(metadata).map(async ([key, val]: [string, any]) => {
      if (val?.then) {
        metadata[key] = await val;
      } else if (typeof(val) === 'function') {
        const promiseOrResult = val();
        this.metadata[key] = promiseOrResult;
        metadata[key] = await promiseOrResult;
      }
    }));

    return metadata;
  }
}
