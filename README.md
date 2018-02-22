# EtherBay

An Ethereum smart contract and website interface for incentivized requesting/distributing of content.
Smart contracts are used to show users proof-of-interest in requested content, and a refunded deposit
incentivizes requesters/backers to validate submitted content. IPFS's content-based addressing ensures
that there is no tampering of the distributed content after its upload. It also includes a new ERC-721
compliant non-fungible token, called Flags, which are distributed to users upon transactons with the
EtherBay Dapp and are identified by their unique ID and corresponding flag image (which is rendered in
an HTML canvas).

## Development Deployment

**Dependencies**:
* npm
* ipfs-mini
* [BigNumber](https://github.com/MikeMcl/bignumber.js/)
* [ipfs](https://ipfs.io/)
* [truffle](http://truffleframework.com/)

**Creating Ethereum Environment**
This project is developed using the Truffle framework.
To build the smart contracts, run `truffle compile`. Then to instantiate a fake blockchain+network, execute `truffle develop`.
This will launch a prompt where the command `migrate` can be entered to deploy the compiled EtherBay contract to the test blockchain.

**Setup IPFS**
Since we are the webserver, we should be the ones running the IPFS gateway that we query.
Follow instructions [here](https://ipfs.io/docs/install/) to install an ipfs gateway peer.
The result should be a daemon ipfs gateway with an API port open on port 5001.

**Run the Webserver**
To run the webserver on port 8080, in a separate console run `npm run dev`.
