import { clean } from './utils/clean';

export class Metadata {
  private metadata: { [key: string]: any };

  constructor(metadata: { [key: string]: any }) {
    this.metadata = metadata;
  }

  getRawMetadata() {
    return this.metadata;
  }

  async getMetadata() {
    const metadata = { ...this.metadata };

    await Promise.all(Object.entries(metadata).map(async ([key, val]: [string, any]) => {
      if (val?.then) {
        metadata[key] = clean(await val);
      } else if (typeof(val) === 'function') {
        const promiseOrResult = val();
        this.metadata[key] = promiseOrResult;
        metadata[key] = clean(await promiseOrResult);
      } else {
        // Since adapters generate objects in an isolated context, some serializers such
        // as Next.js don't recognize these objects as plain objects. The 'clean'
        // function will recreate fresh objects in the main context.
        metadata[key] = clean(metadata[key]);
      }
    }));

    return metadata;
  }
}
