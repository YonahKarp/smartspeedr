chrome.extension.sendMessage({}, function(response) {});

let mediaNodeList
let overlayNode

let media;
let contextObj = {}
let analyser;
let dataArray;
let intervalId;
let defaults = {
    "active": false,
    "baseSpeed": 1.1
};

let settings = new Store("settings", defaults);
let basePlaybackRate = settings.get('baseSpeed');

if(settings.get('active'))
	initialSetup(true)


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.type){
			case 'popupOpened':
				if(settings.get('active'))
					initialSetup(false);
				sendResponse(settings.toObject())
				break;
			case 'activateSmartSpeed':
				settings.set('active', request.value)

				if (request.value) {
					initialSetup(true);
				} else
					teardown();
				break;
			case 'setBaseSpeed':
				basePlaybackRate = request.value
				settings.set('baseSpeed', basePlaybackRate)
				break;
			case 'mediaOver':
				overlaySVG(mediaNodeList[request.value])
				break;
			case 'mediaOut':
				removeOverlay();
				break;
			case 'mediaSelect':
				teardown();
				media = mediaNodeList[request.value]
				checkContextAndStart()
				break;
			default:
				console.log('no action defined for message type')
		}
	}
);

function initialSetup(active){
	mediaNodeList = document.querySelectorAll('video, audio');

	if(mediaNodeList.length == 0){
		chrome.extension.sendMessage({type: 'noVideo', video: false}, function(response) {})
		return
	} else if (mediaNodeList.length > 1){
		sendMediaList()
	}

	if(!media || !media.parentNode)
		media = mediaNodeList[0];

	if(active){
		checkContextAndStart();
	}
}

function checkContextAndStart(){

	if(contextObj[media.src] && contextObj[media.src].state == "running") {
		startAnalyzer();
		return
	}

	createAudioContext(media);
	startAnalyzer();
}

//TO:DO fix occasional video burnout
function createAudioContext(media){
	let context = new AudioContext();
	let src = context.createMediaElementSource(media);

	contextObj[media.src] = context;

	analyser = context.createAnalyser();

	src.connect(analyser);
	analyser.connect(context.destination);

	analyser.fftSize = 32;
	analyser.smoothingTimeConstant = 0.05;

	let bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);
}

function startAnalyzer(){

	if(media.isPlaying)
		intervalId = setInterval(analyseDbLevels, 100)

	media.onpause = function(){	console.log("onPause");	clearInterval(intervalId)}
	media.onended = function(){console.log("onEnded");	clearInterval(intervalId)}
	media.onstalled = function(){console.log('stalled')}
	media.onwaiting = function(){
		console.log('waiting');
		clearInterval(intervalId);
		media.ontimeupdate = function(){
			console.log('timeupdate');
			clearInterval(intervalId);
			intervalId = setInterval(analyseDbLevels, 100);
			media.ontimeupdate = null
		}
	}

	media.onplaying = function(){
		console.log("onPlaying")
		clearInterval(intervalId)
		intervalId = setInterval(analyseDbLevels, 100)
	}
}

function analyseDbLevels(){
	analyser.getByteFrequencyData(dataArray)

	let volumeMultiplier = media.muted ? 0 : media.volume

	let silenceThreshold = 90*volumeMultiplier
	let slicedArray = dataArray.slice(3)
	let peak = Math.max(...slicedArray)

	if(peak < silenceThreshold){
		let k = 0.02 * ((3.2 - basePlaybackRate)/2);
		let newRate = basePlaybackRate + Math.min( (silenceThreshold - peak)*k, 1);
		media.playbackRate = newRate
		console.log("newRate: ", newRate)
		chrome.extension.sendMessage({type: 'newRate', value: newRate}, function(response) {})
	}else{
		if(media.playbackRate != basePlaybackRate){
			media.playbackRate = basePlaybackRate
			chrome.extension.sendMessage({type: 'newRate', value: basePlaybackRate}, function(response) {})
		}
	}
}

function sendMediaList(){
	let mediaList = [...mediaNodeList].map((media, i)=>{ return {
		index: i,
		poster: media.poster,
		src: media.src,
		label: media.ariaLabel
	}})
	chrome.extension.sendMessage({type: 'multipleMedia', mediaList}, function(response) {})
}

function overlaySVG(el){
	removeOverlay();

	if(!el || !el.parentNode){
		mediaNodeList = document.querySelectorAll('video, audio');
		sendMediaList()
		return
	}
	let rect = el.getBoundingClientRect()	

	overlayNode = document.createElement('div');
	overlayNode.style = `height: ${rect.height}px; width: ${rect.width}px; position: fixed; z-index: 1; top: ${rect.top}px; left: ${rect.left}px; background: #F97E1055;`

	document.body.prepend(overlayNode)
}

function removeOverlay(){
	if(overlayNode && overlayNode.parentNode)
		document.body.removeChild(overlayNode)
}

document.addEventListener('loadeddata',function(e){

	if(settings.get('active') && (!media || !media.parentNode)){
		initialSetup(true)
	}
},true);

function teardown(){
	clearInterval(intervalId);
	if(media){
		media.playbackRate = 1;
		media.onplay = null;
		media.onpause = null;
		media.onended = null;
		media = null;
	}
}
