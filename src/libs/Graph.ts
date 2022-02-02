import { HTTP } from './HTTP';

interface GraphProps {
  http: HTTP;
}

export interface QueryOptions {
  subgraph?: string;
  subgraphId?: string;
  query: string;
  variables?: any;
  operationName?: string;
  node?: string;
}

const DEFAULT_NODE = 'https://api.thegraph.com';

export class Graph {
  private http: HTTP;

  constructor({ http }: GraphProps) {
    this.http = http;
  }

  async query(options: QueryOptions): Promise<any>;
  async query(subgraph: string, query: string, variables?: any): Promise<any>;
  async query(subgraph: string | QueryOptions, query?: string, variables?: any): Promise<any> {
    const variablesIsLegacy = variables?.variables || variables?.node
    const options: QueryOptions = {
      subgraph: (typeof subgraph === 'string' ? subgraph : ''),
      query: query || '',
      variables: variablesIsLegacy ? {} : variables,
      ...(variablesIsLegacy ? variables : null),
      ...(typeof subgraph !== 'string' ? subgraph : null),
    }

    if (!options.subgraph && !options.subgraphId) {
      throw new Error(`Must set a subgraph or subgraphId`)
    }

    const node = options.node || DEFAULT_NODE;
    const url = options.subgraphId ? `${node}/subgraphs/id/${options.subgraphId}` : `${node}/subgraphs/name/${options.subgraph}`
    const response = await this.http.post(url, {
        query: options.query,
        variables: options.variables || {},
        operationName: options.operationName || null,
    });

    if (response.errors) {
      throw new Error(`Error querying ${subgraph}: ${response.errors[0].message}`);
    }

    return response.data;
  }
}
