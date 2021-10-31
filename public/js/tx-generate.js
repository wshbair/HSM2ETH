 function lookup() {
     $('#transactionSetup').addClass('active')
     $.ajax({
         type: "POST",
         url: "/api/keys/getpublickey",
         data: {
             ethereumAddress: $('#ethereumAddress').val()
         },
         success: function(result) {

             $('#publickey').val(result.pkstr)
             $('#newNonce').val(result.txCount)

         },
         complete: function() {
             $('#transactionSetup').removeClass('active')
         }
     })
 }

 function GenerateTX() {
     $('#transactionSetup').addClass('active')
     $.ajax({
         type: "POST",
         url: "/api/tx/generator",
         data: {
             ethereumAddress: $('#ethereumAddress').val(),
             newNonce: $('#newNonce').val(),
             toAddr: $('#toAddr').val(),
             value: $('#value').val()
         },
         success: function(result) {
             $('#rawtx').val(result.serializedTx)
         },
         complete: function() {
             $('#transactionSetup').removeClass('active')
         }
     })
 }


 function SubmitTx() {
     $('#transactionSetup').addClass('active')
     $.ajax({
         type: "POST",
         url: "/api/tx/submit",
         data: {
             rawtx: $('#rawtx').val()
         },
         success: function(result) {
             console.log(result)
             $('#SaveStep1_msg').show()
             $('#SaveStep1_msg').addClass('positive')
             $('#SaveStep1_msg').html("Transaction hash: " + result.transactionHash + "  (<a target='_blank' href='https://rinkeby.etherscan.io/tx/" +
                 result.transactionHash + "'>View on Ethereum</a>)")
         },
         complete: function() {
             $('#transactionSetup').removeClass('active')
         }
     })
 }