import { HTTP } from './HTTP';

interface GraphProps {
  http: HTTP;
}

interface Options {
  variables?: any;
  operationName?: string;
  node?: string;
}

export class Graph {
  private http: HTTP;

  constructor({ http }: GraphProps) {
    this.http = http;
  }

  async query(
    subgraph: string,
    query: string,
    {
      variables,
      operationName,
      node = 'https://api.thegraph.com',
    }: Options = {}
  ): Promise<any> {
    const response = await this.http.post(`${node}/subgraphs/name/${subgraph}`, {
        query,
        variables,
        operationName,
    });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    return response.data;
  }
}
