$(document).ready(function() {
    $('#publickey').val("")
    $('#ethereum_address').val("")

})

function GenetateKey() {
    $('#loadInstallmentsTxs').addClass('active')
    keylabel = $('#keylbl').val()
    $.ajax({
        type: "POST",
        url: "/api/keys/generate",
        data: { "keylabel": keylabel },
        success: function(result) {
            console.log(result)
            $('#publickey').val(result.pkstr)
            $('#ethereum_address').val(result.EthAddr)
        },
        complete: function() {
            $('#loadInstallmentsTxs').removeClass('active')

        }
    })
}