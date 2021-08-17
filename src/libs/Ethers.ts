import { ethers } from 'ethers';
import { BlockTag } from '@ethersproject/abstract-provider';
import { ChainData } from './ChainData';

class Provider extends ethers.providers.JsonRpcProvider {
  public isArchive: boolean;
  private chainData: ChainData;
  private id: string;

  constructor(url: string, id: string, archive: boolean, chainData: ChainData) {
    super(url);
    this.isArchive = archive;
    this.id = id;
    this.chainData = chainData;
  }

  async _getBlockTag(blockTag: BlockTag | Promise<BlockTag>): Promise<BlockTag> {
    blockTag = await blockTag;

    if (blockTag) {
      if (!this.isArchive) {
        throw new Error(`Unable to query by blockTag: provider is not archive node`);
      }


      if (/\d{4}-\d{2}-\d{2}/.test(blockTag.toString())) {
        return this.chainData.getBlockNumber(blockTag as string, this.id);
      }
    }

    return super._getBlockTag(blockTag);
  }
}

const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
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
  private chainData: ChainData;
  private providersByNetwork: { [network: string]: ProviderData } = {};

  constructor({ chainData }: { chainData: ChainData }) {
    this.chainData = chainData;
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
