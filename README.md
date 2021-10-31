![hsm2eth logo](logo.png)
# HSM-based Ethereum Key Management Solution
Use HSM to generate and sign Ethereum transaction

### Built With


* [Express - Node.js web application framework](https://expressjs.com)
* [SoftHSM](https://www.opendnssec.org/softhsm/)
* [Semantic UI](https://semantic-ui.com/)

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites
* Install the SoftHSM from [https://www.opendnssec.org/softhsm/](https://www.opendnssec.org/softhsm/)
* Local or remote Ethereum Geth instance [https://geth.ethereum.org/](Geth)
  
### Installation

2. Clone the repo
   ```sh
   git clone https://github.com/wshbair/HSM2ETH.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Set the Web3 providerin `index.js`
   ```js
   const web3 = new Web3(new Web3.providers.HttpProvider("YOUR GETH Instance"));

   ```
   
5. In console panel run 
   ```sh
   npm start
   ```

6. In the browser open http://localhost:8090

## Demo
[![IMAGE ALT TEXT HERE](demo.png)](https://www.youtube.com/watch?v=R0_-ZKoEGn8)
 
## Credit 
Based on the steps given in [ethereum stackexchange question](https://ethereum.stackexchange.com/questions/73192/using-aws-cloudhsm-to-sign-transactions 
) about using HSM to sign ethereum transactions.


I open source the implementation using [SoftHSM](https://github.com/opendnssec/SoftHSMv2) and [Graphene](https://github.com/PeculiarVentures/graphene).
