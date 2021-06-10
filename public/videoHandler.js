const FPS = 30;
const PLAYBACK_SPEEDS = ["0.2", "0.4", "0.6", "0.8", "1.0"];

let allPlayers;

document.onkeydown = e => {
    /* MODAL SHORTCUTS */

    if (isModalOpen && e.key === "Escape") {
        closeModal(REMOVE_BLUR_BACKDROP);
    }

    // ignore rest of the shortcuts when modal is open or there is no video present
    if (isModalOpen || !allPlayers) return;

    /* VIDEO PLAYBACK SHORTCUTS */

    // toggle play/pause
    if (e.key === " " || e.key === "k") {
        e.preventDefault();

        togglePauseAll();
    }

    // go one frame backwards if video is paused
    if (e.key === "ArrowLeft") {
        if (allPlayers[0].paused()) {
            jumpAll(-1 / FPS);
        }
    }

    // go one frame forwards if video is paused
    if (e.key === "ArrowRight") {
        if (allPlayers[0].paused()) {
            jumpAll(1 / FPS);
        }
    }

    // go 1 seconds backwards
    if (e.key === "ArrowLeft" && e.ctrlKey) {
        jumpAll(-1);
    }

    // go 1 seconds forwards
    if (e.key === "ArrowRight" && e.ctrlKey) {
        jumpAll(1);
    }

    // go 10 seconds backwards
    if (e.key === "j") {
        jumpAll(-10);
    }

    // go 10 seconds forwards
    if (e.key === "l") {
        const step = 10;
        jumpAll(10);
    }

    // toggle mute/unmute
    if (e.key === "m") {
        toggleMuteAll();
    }

    if (e.key === "<") {
        const step = 0.2;

        if (allPlayers[0].playbackRate() - Number.EPSILON > 0.2) {
            setSpeedAll(-0.2);
            $("#speed-slider").val(PLAYBACK_SPEEDS.indexOf((allPlayers[0].playbackRate() - 0.2).toFixed(1)));
            $("#speed-label").html((allPlayers[0].playbackRate() - 0.2).toFixed(1) + "x");
        }
    }

    if (e.key === ">") {
        const step = 0.2;

        if (allPlayers[0].playbackRate() + Number.EPSILON < 1) {
            setSpeedAll(0.2);
            $("#speed-slider").val(PLAYBACK_SPEEDS.indexOf((allPlayers[0].playbackRate() + 0.2).toFixed(1)));
            $("#speed-label").html((allPlayers[0].playbackRate() + 0.2).toFixed(1) + "x");
        }
    }

    if (e.key === "Home") {
        seekAll(0);
    }

    if (e.key === "End") {
        seekAll(100)
    }

    // toggle player fullscreen, only possible for one video
    if (e.key === "f") {
        if (allPlayers.length === 1) {
            if (allPlayers[0].isFullscreen()) {
                allPlayers[0].exitFullscreen();
            } else {
                allPlayers[0].requestFullscreen();
            }
        }
    }

    /* ANNOTATION SHORTCUTS */

    if (e.key === "1" || e.code == "Digit1") {
        addKeyframe("before");
    }

    if (e.key === "2" || e.code == "Digit2") {
        addKeyframe("start");
    }

    if (e.key === "3" || e.code == "Digit3") {
        addKeyframe("best");
    }

    if (e.key === "4" || e.code == "Digit4") {
        addKeyframe("end");
    }

    if (e.key === "5" || e.code == "Digit5") {
        addKeyframe("after");
    }

    if (selectedHistory && e.key === "Delete") {
        deleteFromHistory($("#history").find(`.toolbar-item[name="${selectedHistory}"]`));
    }
}

function addKeyframe(keyframeType) {
    if (selectedHistory !== null) {
        $("#status-text").html(keyframeType.toUpperCase());

        presentLabels[selectedHistory][keyframeType] = (getLongestVideoWithDelay().currentTime() - getLongestVideoWithDelay().delay) * FPS;
    
        const visibleFrameCount = (getLongestVideoWithDelay().duration() - getLongestVideoWithDelay().delay) * FPS;
        
        const trapezoidPosX = [
            presentLabels[selectedHistory].before / visibleFrameCount,
            presentLabels[selectedHistory].start  / visibleFrameCount,
            presentLabels[selectedHistory].best   / visibleFrameCount,
            presentLabels[selectedHistory].end    / visibleFrameCount,
            presentLabels[selectedHistory].after  / visibleFrameCount
        ]

        const color = availableLabels.items.find(item => item.name === presentLabels[selectedHistory].name).color;

        drawTrapezoid(trapezoidPosX, color, selectedHistory);
    }
}

function refreshKeyframes() {
    const visibleFrameCount = (getLongestVideoWithDelay().duration() - getLongestVideoWithDelay().delay) * FPS;

    const trapezoidPosX = [
        presentLabels[selectedHistory].before / visibleFrameCount,
        presentLabels[selectedHistory].start  / visibleFrameCount,
        presentLabels[selectedHistory].best   / visibleFrameCount,
        presentLabels[selectedHistory].end    / visibleFrameCount,
        presentLabels[selectedHistory].after  / visibleFrameCount
    ]

    const color = availableLabels.items.find(item => item.name === presentLabels[selectedHistory].name)?.color ||
        "#" + intToRGB(hashCode(selectedHistory.slice(0, selectedHistory.lastIndexOf("_"))));

    drawTrapezoid(trapezoidPosX, color, selectedHistory);
}

let isDragging = false;

$("#timeline")
    .mousedown(e => {
        isDragging = true;
    }).mousemove(e => {
        if (isDragging) {           
            $("#scrubber").css("left",  e.offsetX);
        }
    }).mouseup(e => {
        isDragging = false;

        $("#scrubber").css("left", e.offsetX);

        const percentage = e.offsetX / Timeline.width * 100;
        seekAll(percentage);
    }).mouseleave(e => {
        isDragging = false;
    });

setInterval(() => {
    if (allPlayers?.length > 0 && allPlayers[0].readyState() >= 2 && !isDragging) {
        const percentage = (getLongestVideoWithDelay().currentTime() - getLongestVideoWithDelay().delay) / (getLongestVideoWithDelay().duration() - getLongestVideoWithDelay().delay);
        $("#scrubber").css("left", (percentage * 100) + "%");
    }
}, 10);

$("#speed-slider").on("input", event => {
    allPlayers.forEach(player => {
        player.playbackRate(PLAYBACK_SPEEDS[event.target.value]);
    });

    $("#speed-label").html(PLAYBACK_SPEEDS[event.target.value] + "x");
});

/* SYNC FUNCTIONS */
function seekAll(percentage) {
    // find longest video, its lenght represents 100% on timeline
    const newTime = (getLongestVideoWithDelay().duration() - getLongestVideoWithDelay().delay) * percentage / 100;

    allPlayers.forEach(player => {
        player.currentTime(newTime + player.delay);
    });
}

function pauseAll() {
    allPlayers.forEach(player => {
        player.pause();
        $("#pause-img").hide();
        $("#play-img").show();
    });
}

function playAll() {
    allPlayers.filter(player => player.currentTime() !== player.duration()).forEach(player => {
        player.play();
        $("#pause-img").show();
        $("#play-img").hide();
    });
}

function togglePauseAll() {
    allPlayers.filter(player => player.currentTime() !== player.duration()).forEach(player => {
        if (player.paused()) {
            player.play();
            $("#pause-img").show();
            $("#play-img").hide();
        } else {
            player.pause();
            $("#pause-img").hide();
            $("#play-img").show();
        }
    });
}

function jumpAll(step) {
    allPlayers.forEach(player => {
        player.currentTime(player.currentTime() + step);
    });
}

function toggleMuteAll() {
    allPlayers.forEach(player => {
        player.muted(!player.muted());
    });
}

function setSpeedAll(step) {
    allPlayers.forEach(player => {
        player.playbackRate(player.playbackRate() + step);
    });
}

async function syncAll() {
    const wasPaused = allPlayers[0].paused();

    pauseAll();

    const newTime = getLongestVideoWithDelay().currentTime() - getLongestVideoWithDelay().delay;

    // filter out videos which have already ended
    allPlayers.forEach(player => {
        if (newTime + player.delay > player.duration()) {
            player.currentTime(player.duration());
        }
        else {
            player.currentTime(newTime + player.delay);
        }
    });

    // wait until all videos are buffered
    await waitUntil(() => allPlayers.every(player => player.readyState() >= 4));

    if (!wasPaused) {
        playAll();
    }
}

// check whether all videos are in sync
setInterval(() => {
    if (allPlayers?.length > 0 && allPlayers[0].readyState() >= 2 && !allPlayers[0].paused()) {
        // filter out videos which have already ended
        const currentTimes = allPlayers.filter(player => player.currentTime() !== player.duration()).map(player => player.currentTime() - player.delay);

        // three frames sync tolerance
        const areSync = currentTimes.every(time => Math.abs(time - getLongestVideoWithDelay().currentTime() + getLongestVideoWithDelay().delay) < 2 / FPS);
        
        if (!areSync) {
            console.log("Players were not in sync tolerance +-2 frames, syncing now.");
            syncAll();
        }
    }

}, 100);

// what should 0% on the timeline represent, ideally at least one video has no delay
function getMinDelay() {
    return Math.min(...allPlayers.map(player => player.delay));
}

// what should 100% on the timeline represent
function getLongestVideoWithDelay() {
    return allPlayers.reduce((v1, v2) => v2.duration() - v2.delay > v1.duration() - v1.delay ? v2 : v1);
}
