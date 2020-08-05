let slider = document.getElementById('speedSlidr');
let labels = document.getElementById('speedLabels');
let activateSwitch = document.getElementById('activate');

let valMap = [1.1, 1.15, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3]
let bgPage = chrome.extension.getBackgroundPage();


//reinstate
activateSwitch.checked = bgPage.state.activated
slider.value = valMap.indexOf(bgPage.state.baseSpeed);
if(bgPage.state.activated){
    if(!bgPage.state.video)
        document.body.classList.add('noVideo')
    else
        document.body.classList.add('showSlider')
}


slider.addEventListener("input", function(e) {
    console.log('change')
    let value = e.target.value
    for(element of labels.children) {
        element.classList.remove('active')
    };

    labels.children[value].classList.add('active')

    let message = {
        type: 'setBaseSpeed',
        value: valMap[value]
    }

    chrome.extension.sendMessage(message, function(response) {})
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
            console.log('recieved feedback: ', response)
        });  
    });
});

activateSwitch.addEventListener('change', function(e){
    if(e.target.checked){
        document.body.classList.add('showSlider')
    }else{
        document.body.classList.remove('showSlider')
        document.body.classList.remove('noVideo')

    }

    let message = {
        type: 'activateSmartSpeed',
        value: e.target.checked
    }

    chrome.extension.sendMessage(message, function(response) {})
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
            console.log('recieved feedback: ', response)
        });  
    })
})

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('page_action recieve message: ', request)
        if(!request.video){
            document.body.classList.remove('showSlider')
            document.body.classList.add('noVideo')
        }

        sendResponse()
    }
);