import 'isomorphic-fetch';

export class HTTP {
  async get(url: any) {
    const request = await fetch(url);
    const response = await request.json();
    return response;
  }

  async post(url: string, body: any) {
    const request = await fetch(url, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      method: 'POST',
    });

    const response = await request.json();

    return response;
  }
}
