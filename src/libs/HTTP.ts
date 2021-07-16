import 'isomorphic-fetch';

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
    const request = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
      method: 'POST',
    });

    if (request.status !== 200) {
      throw new Error(`Request to ${url} returned an error`);
    }

    const response = await (options?.plainText ? request.text() : request.json());

    return response;
  }
}
