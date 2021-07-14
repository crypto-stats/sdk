import { HTTP } from './HTTP';

interface GraphProps {
  http: HTTP;
}

export class Graph {
  private http: HTTP;

  constructor({ http }: GraphProps) {
    this.http = http;
  }

  async query(
    subgraph: string,
    query: string,
    variables?: any,
    operationName?: string
  ): Promise<any> {
    const response = await this.http.post(`https://api.thegraph.com/subgraphs/name/${subgraph}`, {
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
