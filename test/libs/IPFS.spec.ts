import { expect } from 'chai';
import { IPFS } from '../../src/libs/IPFS';

describe('IPFS', function() {
  let ipfs = new IPFS();

  beforeEach(() => {
    ipfs = new IPFS();
  });

  it('should load a text file from IPFS', async () => {
    const result = await ipfs.getFile('QmSTbSvecWDxM1jPDKBJ2ECBTwwuSAFEyuA111NvMYosr3');

    expect(result).to.equal('test123');
  });

  it('should load a data URI', async () => {
    const uri = await ipfs.getDataURI('QmagaZMuMQKU2a5aJ2VofXBNwHmYpzo8GUR9CCjLWbgxTE', 'image/svg+xml');

    expect(uri).to.equal('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==');
  });
});
