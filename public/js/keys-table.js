$(document).ready(function() {
    var eventsHash = [];
    $('#loadInstallmentsTxs').addClass('active')
    $.ajax({
        type: "GET",
        url: "/api/keys/all",
        success: function(result) {
            //get keys
            var i = 1
            result.forEach(key => {
                $("#keys-table").find('tbody')
                    .append("<tr>" +
                        "<td>" + i + "</td>" +
                        "<td>Ethereum</td>" +
                        "<td>" + key.EthAddr + "</td>" +
                        "<td> " + key.pkstr + "* </td>" +
                        "<td><div class = 'ui purple horizontal label'>" + key.label + "</div></td > " +
                        "<td><a target='_blank' href='https://rinkeby.etherscan.io/address/" + key.EthAddr + "'> View on Ethereum</a></td>" +
                        "</tr>");
                i++;
            });
        },
        complete: function() {
            $('#loadInstallmentsTxs').removeClass('active')
        }
    })
})