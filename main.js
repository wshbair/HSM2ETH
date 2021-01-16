// Developed by Wazen SHBAIR
// Research associate in University of Luxembourg
// wazen.shbair@gmail.com

var graphene = require("graphene-pk11");
var util = require('ethereumjs-util')
const keccak256 = require('js-sha3').keccak256;
const EthereumTx = require('ethereumjs-tx').Transaction
const BigNumber = require('bignumber.js');
var Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/d7a46824a4114bab88183f23154d6521"));
var Module = graphene.Module;

var lib = "/usr/local/lib/softhsm/libsofthsm2.so"; //linux
//var lib ="D:/SoftHSM2/lib/softhsm2-x64.dll" //windows

var mod = Module.load(lib, "SoftHSM");
mod.initialize();

var slot = mod.getSlots(0);
var session
if (slot.flags & graphene.SlotFlag.TOKEN_PRESENT) {
    session = slot.open(graphene.SessionFlag.RW_SESSION | graphene.SessionFlag.SERIAL_SESSION);
    session.login("12345");
    
     // generate ECDSA key pair
     var keys = session.generateKeyPair(graphene.KeyGenMechanism.ECDSA, {
        label: "publickey",
        id: Buffer.from([1, 2, 3, 4, 5]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html
        keyType: graphene.KeyType.ECDSA,
        token: true,
        verify: true,
        paramsECDSA: graphene.NamedCurve.getByName("secp256k1").value,
        
    }, {
        keyType: graphene.KeyType.ECDSA,
        label: "privateKey",
        id: Buffer.from([1, 2, 3, 4, 5]), // uniquer id for keys in storage https://www.cryptsoft.com/pkcs11doc/v230/group__SEC__9__7__KEY__OBJECTS.html        
        token: true,
        sign: true
    }); 

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Extract Public Key and calculate Ethereum Address
    ////////////////////////////////////////////////////////////////////////////////////////////
    
    /// the first 3 byte for uncompressed key 
    // https://tools.ietf.org/html/rfc5480#section-2.2
    puplicKey = decodeECPointToPublicKey(keys.publicKey.getAttribute({pointEC: null}).pointEC)
    const address = keccak256(puplicKey) // keccak256 hash of publicKey     
    const buf2 = Buffer.from(address, 'hex');
    const EthAddr="0x"+buf2.slice(-20).toString('hex') // take lat 20 bytes as ethereum adress
    console.log("Generated Ethreum address:" + EthAddr) 
    ////////////////////////////////////////////////////////////////////////////////////////////
    //First sign : sign the ethreum address of the sender
    ////////////////////////////////////////////////////////////////////////////////////////////
    encoded_msg = EthAddr 
    var msgHash = util.keccak(encoded_msg) // msg to be signed is the generated ethereum address
    addressSign = calculateEthereumSig(msgHash,EthAddr,keys.privateKey)

    //using the r,s,v value from the first signautre in the transaction parameter
    const txParams = {
        nonce: "0x6",
        gasPrice: '0x0918400000',
        gasLimit: 160000,
        to: '0x0000000000000000000000000000000000000000',
        value: '0x00',
        data: '0x00',
        r: addressSign.r, // using r from the first signature
        s: addressSign.s, // using s from the first signature
        v: addressSign.v
    }

    const tx = new EthereumTx(txParams, {'chain':'rinkeby'})
    var msgHash = tx.hash(false)
    ////////////////////////////////////////////////////////////////////////////////////////////
    //Second sign: sign the raw transactions, thanks for @lucashenning for discoving this step 
    ////////////////////////////////////////////////////////////////////////////////////////////
    const txSig = calculateEthereumSig(msgHash,EthAddr, keys.privateKey)
    tx.r = txSig.r
    tx.s = txSig.s
    tx.v = txSig.v
    
    const serializedTx = tx.serialize().toString('hex') 
    // Transaction ready for submission 
    web3.eth.sendSignedTransaction('0x'+serializedTx)
   .on('confirmation', function(confirmationNumber, receipt){
     console.log(receipt)
   })   
   .on('error', console.error);
        
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

function calculateEthereumSig(msgHash, EthreAddr, privateKey)
{
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Contiue Signing until find s < (secp256k1.size/2)
    ///////////////////////////////////////////////////////////////////////////////////////////////
    var flag=true
    while (flag) {
        var sign = session.createSign("ECDSA", privateKey);
        var tempsig = sign.once(msgHash)
        ss = tempsig.slice(32,64)
        s_value = new BigNumber(ss.toString('hex'), 16);
        secp256k1N = new BigNumber("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)
        secp256k1halfN = secp256k1N.dividedBy(new BigNumber(2))
        if (s_value.isLessThan(secp256k1halfN))
            flag=false
            }

    const rs = {
        r: tempsig.slice(0, 32),
        s: tempsig.slice(32, 64)
      };
    var v = 27
    var pubKey= util.ecrecover( util.toBuffer(msgHash), v, rs.r, rs.s)
    var addrBuf = util.pubToAddress(pubKey);
    var RecoveredEthAddr= util.bufferToHex(addrBuf);
    
    if(EthreAddr!=RecoveredEthAddr)
    {  
       v = 28
       pubKey= util.ecrecover( util.toBuffer(msgHash), v, rs.r, rs.s)
       addrBuf = util.pubToAddress(pubKey);
       RecoveredEthAddr= util.bufferToHex(addrBuf);  
    }
    return {r:rs.r, s:rs.s, v:v}
}
