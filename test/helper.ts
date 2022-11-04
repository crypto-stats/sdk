import { Context, ContextProps } from "../src/Context";
import { IPFS } from "../src/libs/IPFS";
import { Log } from "../src/libs/Log";

export function createContext(props: Partial<ContextProps> = {}) {
  const ipfs = new IPFS();
  const context = new Context({
    coinGecko: {} as any,
    cosmos: {} as any,
    chainData: {} as any,
    date: {} as any,
    defiLlama: {} as any,
    graph: {} as any,
    http: {} as any,
    ethers: {} as any,
    etherscan: {} as any,
    log: new Log(),
    plugins: {} as any,
    ipfs,
    collection: {} as any,
    ...props,
  });

  return context;
}