import { ethers } from 'ethers';

class Provider extends ethers.providers.JsonRpcProvider {
  public isArchive: boolean;

  constructor(url: string, archive: boolean) {
    super(url);
    this.isArchive = archive;
  }

  send(method: string, params: any[]) {
    if (method === 'eth_call' && params[0].blockTag && !this.isArchive) {
      throw new Error(`Unable to call ${params[0].to} on block ${params[0].blockTag}: provider is not archive node`);
    }
    return super.send(method, params);
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
  private providersByNetwork: { [network: string]: ProviderData } = {};

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
      providerData.provider = new Provider(providerData.url, providerData.archive);
    }
    return providerData.provider;
  }
}
