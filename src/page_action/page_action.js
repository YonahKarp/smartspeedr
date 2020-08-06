let slider = document.getElementById('speedSlidr');
let labels = document.getElementById('speedLabels');
let activateSwitch = document.getElementById('activate');
let mediaList = document.getElementById('mediaList');
let rate = document.getElementById('rate')

let valMap = [1.1, 1.15, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3]
let bgPage = chrome.extension.getBackgroundPage();


//reinstate
activateSwitch.checked = bgPage.state.activated
slider.value = valMap.indexOf(bgPage.state.baseSpeed);
rate.innerHTML = bgPage.state.baseSpeed || 1;

if(bgPage.state.activated){
    if(!bgPage.state.video)
        document.body.classList.add('noVideo')
    else
        document.body.classList.add('showSlider')
}


//TO:DO fix slider
slider.addEventListener("input", function(e) {
    let value = e.target.value
    for(element of labels.children) {
        element.classList.remove('active')
    };

    labels.children[value].classList.add('active')

    let message = {
        type: 'setBaseSpeed',
        value: valMap[value]
    }

    rate.innerHTML = valMap[value];

    chrome.extension.sendMessage(message, function(response) {})
    sendMessageToInject(message)
});

activateSwitch.addEventListener('change', function(e){
    if(e.target.checked){
        document.body.classList.add('showSlider')
    }else{
        document.body.className = '';
        mediaList.innerHTML = ''
    }

    let message = {
        type: 'activateSmartSpeed',
        value: e.target.checked
    }

    chrome.extension.sendMessage(message, function(response) {})
    sendMessageToInject(message)
})

function test(e){
    console.log(e)
}

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('page_action recieve message: ', request)

        switch(request.type){
            case 'noVideo':
                document.body.className = '';
                document.body.classList.add('noVideo')
                break;
            case 'multipleMedia':
                document.body.className = '';
                document.body.classList.add('mutipleMedia')
                createMediaList(request)
                break;
            case 'newRate':
                rate.innerHTML = request.value
                break;
            default:
                ;
        }

        sendResponse()
    }
);

function createMediaList(request){
    mediaList.innerHTML = ''
    request.mediaList.forEach(el => {
         let mediaElement = document.createElement("div")
         mediaElement.classList.add('mediaElement')
         mediaElement.onmouseenter = function(ev){
             console.log("over ", el.index)
             let message = {
                 type: 'mediaOver',
                 value: el.index
             }

             sendMessageToInject(message)
         }
         mediaElement.onmouseleave = function(ev){
            console.log("n`out ", el.index)

            let message = {
                type: 'mediaOut',
                value: el.index
            }

            sendMessageToInject(message)
        }


         mediaElement.innerHTML = `
            ${el.poster ? `<img class="posterImg" src="${el.poster}">` : ''}
            <div class="mediaLabel">${el.label ? el.label : ''}: ${el.src}</div>
         `

         mediaList.append(mediaElement)
    })
}

function sendMessageToInject(message){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {});  
    })
}