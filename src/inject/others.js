Object.defineProperty(HTMLMediaElement.prototype, 'isPlaying', {
    get: function(){
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})
