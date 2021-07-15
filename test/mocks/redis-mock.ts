const redis = {
  createClient(_options: any) {
    const values: { [key: string]: any } = {};

    return {
      get(key: string, callback: (err: any, value: any) => void) {
        callback(null, values[key] || null);
      },
      set(key: string, value: any, callback: (err: any, value: any) => void) {
        values[key] = value;
        callback(null, null);
      },
    }
  },
}

export default redis;
