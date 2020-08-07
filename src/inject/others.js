Object.defineProperty(HTMLMediaElement.prototype, 'isPlaying', {
    get: function(){
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

// console.dev = function(msg){
//     if(window.isDevMode)
//         console.log(msg)
// }