// Developed by Wazen SHBAIR
// Research associate in University of Luxembourg
// wazen.shbair@gmail.com

var graphene = require("graphene-pk11");
var util = require('ethereumjs-util')
const keccak256 = require('js-sha3').keccak256;
const EthereumTx = require('ethereumjs-tx').Transaction
const BigNumber = require('bignumber.js');
var Web3 = require('web3');

//const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/xxx"));
var Module = graphene.Module;

var lib = "/usr/local/lib/softhsm/libsofthsm2.so"; //linux
//var lib ="D:/SoftHSM2/lib/softhsm2-x64.dll" //windows

var mod = Module.load(lib, "SoftHSM");
mod.initialize();

var slot = mod.getSlots(0);
if (slot.flags & graphene.SlotFlag.TOKEN_PRESENT) {
    const session = slot.open(graphene.SessionFlag.RW_SESSION | graphene.SessionFlag.SERIAL_SESSION);
    session.login("12345");
   
    // generate ECDSA key pair
    var keys = session.generateKeyPair(graphene.KeyGenMechanism.ECDSA, {
        label: "EthreAddrees1",
        id: Buffer.from([1, 2, 3, 4, 5]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html
        keyType: graphene.KeyType.ECDSA,
        token: true,
        verify: true,
        paramsECDSA: graphene.NamedCurve.getByName("secp256k1").value
    }, {
        keyType: graphene.KeyType.ECDSA,
        label: "EthreAddrees1",
        id: Buffer.from([1, 2, 3, 4, 5]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html        
        token: true,
        sign: true
    });

    
    ////////////////////////////////////////////////////////////////////////////////////////////
    // Extract Public Key and calculate Ethereum Address
    ////////////////////////////////////////////////////////////////////////////////////////////
    
    /// the first 3 byte for uncompressed key 
    // https://tools.ietf.org/html/rfc5480#section-2.2
    puplicKey = decodeECPointToPublicKey(keys.publicKey.getAttribute({pointEC: null}).pointEC)
    const address = keccak256(puplicKey) // keccak256 hash of publicKey     
    const buf2 = Buffer.from(address, 'hex');
    const EthAddr="0x"+buf2.slice(-20).toString('hex') // take lat 20 bytes as ethereum adress
    console.log("Generated Ethreum address:" + EthAddr) 
    
    encoded_msg = EthAddr 
    var msgHash = util.keccak(encoded_msg) // msg to be signed is the generated ethereum address

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Contiue Signing until find s < (secp256k1.size/2)
    ///////////////////////////////////////////////////////////////////////////////////////////////
    var flag=true
    while (flag) {
        var sign = session.createSign("ECDSA", keys.privateKey);
        var tempsig = sign.once(msgHash)
        ss = tempsig.slice(32,64)
        s_value = new BigNumber(ss.toString('hex'), 16);
        secp256k1N = new BigNumber("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16) // max value on the curve
        secp256k1halfN = secp256k1N.dividedBy(new BigNumber(2))
        if (s_value.isLessThan(secp256k1halfN))
            flag=false
            }

    const rs = {
        r: tempsig.slice(0, 32),
        s: tempsig.slice(32, 64)
      };

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Recover/exract the public key from signed msg to validate the signature 
    ///////////////////////////////////////////////////////////////////////////////////////////////
      var v = 27
      var pubKey= util.ecrecover( util.toBuffer(msgHash), v, rs.r, rs.s)
      var addrBuf = util.pubToAddress(pubKey);
      var RecoveredEthAddr= util.bufferToHex(addrBuf);
      
      if(EthAddr!=RecoveredEthAddr)
      {  
         v = 28
         pubKey= util.ecrecover( util.toBuffer(msgHash), v, rs.r, rs.s)
         addrBuf = util.pubToAddress(pubKey);
         RecoveredEthAddr= util.bufferToHex(addrBuf);  
      }
      
      console.log( "Recovered ethereum address: " +  RecoveredEthAddr)
      // if the recovred and generated key are equal you are good to go 
      
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Prepare and send singned ethereum transaction 
    ///////////////////////////////////////////////////////////////////////////////////////////////
      const txParams = {
        nonce: '0x0',
        gasPrice: '0x09184e72a00',
        gasLimit: '0x27100',
        to: '0x4D8519890C77217A352d3cC978B0b74165154421',  
        value: '0x00',
        chainId: 4
      };

      const tx = new EthereumTx(txParams, {'chain':'rinkeby'})
      tx.r=rs.r
      tx.s=rs.s
      tx.v=v
      const serializedTx = tx.serialize().toString('hex') 

    // Send signed tx to ethereum network  
    //   web3.eth.sendSignedTransaction('0x'+serializedTx)
    //  .on('confirmation', function(confirmationNumber, receipt){
    //    res.json(receipt)
    //  })   
    //  .on('error', console.error);
 
          
    session.logout();
    session.close();
}
else {
    
    console.error("Slot is not initialized");
}

mod.finalize();

function decodeECPointToPublicKey (data)
{
    if ((data.length === 0) || (data[0] !== 4)) {
        throw new Error("Only uncompressed point format supported");
      }
      // Accoring to ASN encoded value, the first 3 bytes are
      //04 - OCTET STRING
      //41 - Length 65 bytes
      //For secp256k1 curve it's always 044104 at the beginning
      return data.slice(3,67)
}
