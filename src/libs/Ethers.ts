import { ethers, utils, BigNumber, FixedNumber } from 'ethers';
import { BlockTag } from '@ethersproject/abstract-provider';
import { ChainData } from './ChainData';

const DEFER_TIME_MS = 10;

// Using https://github.com/mds1/multicall
const MULTICALL_ADDR = '0xca11bde05977b3631167028862be2a173976ca11';

const multicallChains = [
  '0x1',
  '0x38', // BSC
  '0xa86a', // Avalanche
  '0x89', // Polygon
  '0xa', // Optimism
  '0xa4b1', // Arb1
  '0xfa', // Fantom
  '0x504', // Moonbeam
]

const multicallAbi = [
  {
    "inputs": [
      {
        "name": "requireSuccess",
        "type": "bool"
      },
      {
        "components": [
          {
            "name": "target",
            "type": "address"
          },
          {
            "name": "callData",
            "type": "bytes"
          }
        ],
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "tryAggregate",
    "outputs": [
      {
        "components": [
          {
            "name": "success",
            "type": "bool"
          },
          {
            "name": "returnData",
            "type": "bytes"
          }
        ],
        "name": "returnData",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class Provider extends ethers.providers.JsonRpcProvider {
  public isArchive: boolean;
  private chainData: ChainData;
  private id: string;
  private chainIdPromise: Promise<string> | null = null;
  private deferredCalls: { to: string, data: string, callback: (err: any, result: string) => void }[] = [];

  constructor(url: string, id: string, archive: boolean, chainData: ChainData) {
    super(url);
    this.isArchive = archive;
    this.id = id;
    this.chainData = chainData;
  }

  getChainId() {
    if (!this.chainIdPromise) {
      this.chainIdPromise = super.send('eth_chainId', []);
    }
    return this.chainIdPromise;

  }

  async send(method: string, params: any[]) {
    if (method === 'eth_chainId') {
      return this.getChainId();
    }

    if (method === 'eth_call') {
      const chainId = await this.getChainId();

      if (multicallChains.indexOf(chainId) !== -1 && params[0].to !== MULTICALL_ADDR) {
        return this.deferredCall(params[0].to, params[0].data);
      }
    }

    const response = await super.send(method, params);
    return response;
  }

  deferredCall(to: string, data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const callback = (err: any, result: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
      this.deferredCalls.push({ to, data, callback });

      if (this.deferredCalls.length === 1) {
        setTimeout(async () => {
          const calls = this.deferredCalls;
          this.deferredCalls = [];

          if (calls.length > 0) {
            const multicall = new ethers.Contract(MULTICALL_ADDR, multicallAbi, this);
            const result = await multicall.tryAggregate(false, calls.map(call => [call.to, call.data]));

            for (let i = 0; i < result.length; i += 1) {
              if (result[i].success) {
                calls[i].callback(null, result[i].returnData);
              } else {
                calls[i].callback(result[i].returnData, '0x');
              }
            }
          }
        }, DEFER_TIME_MS);
      }
    });
  }

  async _getBlockTag(blockTag: BlockTag | Promise<BlockTag>): Promise<BlockTag> {
    blockTag = await blockTag;

    if (blockTag) {
      if (!this.isArchive) {
        throw new Error(`Unable to query by blockTag: provider is not archive node`);
      }


      if (/\d{4}-\d{2}-\d{2}/.test(blockTag.toString())) {
        blockTag = await this.chainData.getBlockNumber(blockTag as string, this.id);
      }
    }

    return super._getBlockTag(blockTag);
  }
}

const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address recipient, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address sender,address recipient,uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

interface ProviderData {
  url: string;
  archive: boolean;
  provider: ethers.providers.JsonRpcProvider | null;
}

export class Ethers {
  public utils: typeof utils;
  public BigNumber: typeof BigNumber;
  public FixedNumber: typeof FixedNumber;

  private chainData: ChainData;
  private providersByNetwork: { [network: string]: ProviderData } = {};

  constructor({ chainData }: { chainData: ChainData }) {
    this.chainData = chainData;
    this.utils = utils;
    this.BigNumber = BigNumber;
    this.FixedNumber = FixedNumber;
  }

  addProvider(name: string, url: string, {
    archive = false,
  }: {
    archive?: boolean,
  } = {}) {
    this.providersByNetwork[name] = { url, archive, provider: null };
  }

  getContract(address: string, abi: any, network = 'ethereum') {
    return new ethers.Contract(address, abi, this.getProvider(network));
  }

  getERC20Contract(address: string, network = 'ethereum') {
    return this.getContract(address, ERC20_ABI, network);
  }

  getProvider(network: string): ethers.providers.JsonRpcProvider {
    const providerData = this.providersByNetwork[network];
    if (!providerData) {
      throw new Error(`Network ${network} is not available`);
    }
    if (!providerData.provider) {
      providerData.provider = new Provider(providerData.url, network, providerData.archive, this.chainData);
    }
    return providerData.provider;
  }
}
