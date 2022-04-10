import { HTTP } from './HTTP';

interface GraphProps {
  http: HTTP;
  apiKey?: string;
}

interface BaseQueryOptions {
  subgraph?: string;
  subgraphId?: string;
  query: string;
  variables?: any;
  operationName?: string;
  node?: string;
}

interface SubgraphQueryOptions extends BaseQueryOptions {
  subgraph: string;
}
interface SubgraphIDQueryOptions extends BaseQueryOptions {
  subgraphId: string;
}
interface GraphQLQueryOptions extends BaseQueryOptions {
  url: string;
}

export type QueryOptions = SubgraphQueryOptions | SubgraphIDQueryOptions | GraphQLQueryOptions;

const DEFAULT_NODE = 'https://api.thegraph.com';
const DEFAULT_API_KEY = '492a6bdebf2293f9c0f2946fbb515691';

const URL_REGEX = /^https?:\/\//;

export class Graph {
  private http: HTTP;
  public apiKey: string;

  constructor({ http, apiKey = DEFAULT_API_KEY }: GraphProps) {
    this.http = http;
    this.apiKey = apiKey;
  }

  async query(options: QueryOptions): Promise<any>;
  async query(subgraph: string, query: string, variables?: any): Promise<any>;
  async query(subgraph: string | QueryOptions, query?: string, variables?: any): Promise<any> {
    const variablesIsLegacy = variables?.variables || variables?.node
    const options: QueryOptions & GraphQLQueryOptions = {
      subgraph: (typeof subgraph === 'string' && !URL_REGEX.test(subgraph) ? subgraph : ''),
      url: (typeof subgraph === 'string' && URL_REGEX.test(subgraph) ? subgraph : ''),
      query: query || '',
      variables: variablesIsLegacy ? {} : variables,
      ...(variablesIsLegacy ? variables : null),
      ...(typeof subgraph !== 'string' ? subgraph : null),
    }

    if (!options.subgraph && !options.subgraphId && !options.url) {
      throw new Error(`Must set a subgraph, subgraphId or URL`)
    }

    const node = options.node || DEFAULT_NODE;

    let url: string = options.url;
    if (options.subgraphId) {
      if (options.subgraphId.indexOf('Qm') === 0) {
        // Hosted subgraph
        url = `${node}/subgraphs/id/${options.subgraphId}`
      } else {
        url = `https://gateway.thegraph.com/api/${this.apiKey}/subgraphs/id/${options.subgraphId}`
      }
    } else if (options.subgraph) {
      url = `${node}/subgraphs/name/${options.subgraph}`;
    }

    const response = await this.http.post(url, {
        query: options.query,
        variables: options.variables || {},
        operationName: options.operationName || null,
    });

    if (response.errors) {
      const name = options.url || options.subgraphId || options.subgraph;
      throw new Error(`Error querying ${name}: ${response.errors.message || response.errors[0].message}`);
    }

    return response.data;
  }
}
