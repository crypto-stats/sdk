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
});
