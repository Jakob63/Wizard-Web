

function submitChoice(btn) {
    var val = btn.dataset.val;

    const input_route = jsRoutes.controllers.HomeController.demoOffer(`${val}`);
    fetch(input_route.url, {
        method: input_route.type,
    }).then(response => {
        if(!response.ok){
            console.log("error")
        }
        return response.json();
    }).then(data => {
        window.location.href = data.message;
    }).catch(error => {
            console.error('Error:', error);
        }

    )

    //var form = document.getElementById('choiceForm');
    //form.action = '/demo_input/' + encodeURIComponent(val);
    //form.submit();
}
function submitNames() {
    var name1 = document.getElementById('name1').value;
    var name2 = document.getElementById('name2').value;
    var name3 = document.getElementById('name3').value;

    var names = [name1, name2, name3].join(',');

    const input_route = jsRoutes.controllers.HomeController.createPlayers(`${names}`);
    fetch(input_route.url, {
        method: input_route.type,
    }).then(response => {
        if(!response.ok){
            console.log("error")
        }
        return response.json();
    }).then(data => {
        window.location.href = data.message;
    }).catch(error => {
            console.error('Error:', error);
        }

    )
}

function playCard(btn) {
    var val = btn.dataset.val;

    const input_route = jsRoutes.controllers.HomeController.demoOffer(`${val}`);
    fetch(input_route.url, {
        method: input_route.type,
    }).then(response => {
        if(!response.ok){
            console.log("error")
        }
        return response.json();
    }).then(data => {
        window.location.href = data.message;
    }).catch(error => {
            console.error('Error:', error);
        }

    )
}