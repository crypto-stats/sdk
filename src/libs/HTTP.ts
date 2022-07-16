import 'isomorphic-fetch';
declare const fetch: any;

export class HTTP {
  async get(url: string, options?: any) {
    const request = await fetch(url, options);

    if (request.status !== 200) {
      throw new Error(`Request to ${url} returned an error`);
    }

    const response = await (options?.plainText ? request.text() : request.json());
    return response;
  }

  async post(url: string, body: any, options?: any) {
    const headers = options?.headers || {};
    const contentType = headers['content-type'] || headers['Content-Type'] || 'application/json';

    const encodedBody = contentType === 'application/json' ? JSON.stringify(body) : body;

    const request = await fetch(url, {
      ...options,
      headers: {
        'content-type': contentType,
        ...headers,
      },
      body: encodedBody,
      method: 'POST',
    });

    if (request.status !== 200) {
      throw new Error(`Request to ${url} returned an error (${request.status})`);
    }

    const response = await (options?.plainText ? request.text() : request.json());

    return response;
  }
}
