/*
    Slides by Cliff Hewitt, July 2, 2024

    A slideshow of random images and tunes.
    Keyboard shortcuts:

    'P' Pause / unpause slideshow
    'A' audio on / off
    'N' next tune
    Arrow keys for next / previous image
    ESC to escape from full screen slide show
*/

const IMG = "#image";
const START = "#start";
const AUTO = "#cbAuto";
const SOUND = "#cbSound";
const SECS = "#seconds";
const TUNE = "#tunes";
const PERSIST_SECS = "seconds";

let idxMp3s = Array.from({ length: MP3S.length }, (_, i) => i);  // 0, 1, 2, ... 
let idxTunes = 0;
let idxImg = undefined;
let intervalId;
let audio;
let containerWidth;
let containerHeight;

function init() {
    const img = $(IMG);

    randomize(IMGS);
    randomize(idxMp3s);
    setContainerSize();
    initControls();

    $(START).on('click', function() {
        $(START).blur();  // Remove focus
        $(AUTO).prop('checked', true);
        $('#imgContainer')[0].requestFullscreen();
        start();
    });

    $("#shuffle").on('click', function() {
        shuffle(img);
    });

    $(SECS).click(function() {
        clickSeconds();
    });

    $(SOUND).on('click', function() {
        playMp3();
    });

    $(AUTO).on('click', function() {
        if (isAuto()) {
            start();
        }
        else if (intervalId) {
            clearInterval(intervalId);
            intervalId = undefined;
        }
    });

    $(document).keydown(function(event) {
        keybaordHandler(event);
    });

    $(document).on('fullscreenchange', function() {
        if (!document.fullscreen) {
            stopShow();
        }
    });

    $(TUNE).change(function() {
        changeTune();
    });

    $(window).resize(function() {
        setContainerSize();
        alignImage(img);
    });
}

function keybaordHandler(event) {
    if (event.key === "ArrowLeft" || event.keyCode === 37) {
        stopAuto();
        advance(false);
    }
    else if (event.key === "ArrowRight" || event.keyCode === 39) {
        stopAuto();
        advance(true);
    }
    else if (event.key.toLowerCase() === 'p') {  // slideshow pause/unpause
        pause();
    }
    else if (event.key.toLowerCase() === 'a') {  // audio on/off
        if (isSound()) {
            pauseAudio();
        }
        else {
            $(SOUND).prop('checked', true);
            playMp3();
        }
    }
    else if (event.key.toLowerCase() === 'n') {  // next tune
        nextTune();
    }
}

function shuffle(img) {
    let sound = isSound();
    stopShow();
    img.hide();
    idxImg = undefined;
    idxTunes = 0;
    randomize(IMGS);
    randomize(idxMp3s);
    setTune();
    setTitle(' ');

    if (audio) {
        audio.src = currentTune();
    }

    $(SOUND).prop('checked', sound);
}

function changeTune() {
    let idx = Number($(TUNE).val());
    for (var i = 0; i < idxMp3s.length; i++) {
        if (idx === idxMp3s[i]) {
            idxTunes = i;
            break;
        }
    }

    setTune();

    if (audio) {
        audio.pause();
        audio.src = currentTune();
        if (isSound()) {
            audio.play();
        }
    }
}

function pause() {
    if (isAuto()) {
        stopAuto();
        pauseAudio();
    }
    else {
        $(AUTO).prop('checked', true);
        $(SOUND).prop('checked', true);
        start();
    }
}

function currentTune() {
    return 'sounds/' + MP3S[idxMp3s[idxTunes]].name + '.mp3';
}

function clickSeconds() {
    let seconds = getSeconds() + 1;
    if (seconds > 9) {
        seconds = 1;
    }
    $(SECS).text(seconds);
    persistSeconds();

    if (intervalId) {
        stopAuto();
    }
}

function initControls() {
    let seconds = localStorage.getItem(PERSIST_SECS);
    if (seconds) {
        $(SECS).text(seconds);
    }
    else {
        persistSeconds();
    }

    $("#autoText").attr('title', IMGS.length + " photos");
    initTunesList();
}

function initTunesList() {
    var $tunes = $(TUNE);

    $tunes.empty();

    for (var i = 0; i < MP3S.length; i++) {
        var name = MP3S[i].name;
        let $opt = $('<option></option>');
        $opt.attr('value', i);
        $opt.attr('title', MP3S[i].info);
        $opt.text(name);
        $tunes.append($opt);
    }

    setTune();
}

function setTune() {
    $(TUNE).val(idxMp3s[idxTunes]);
    $(TUNE).attr('title', MP3S[idxMp3s[idxTunes]].info);
}

function persistSeconds() {
    let secs = $(SECS).text();
    localStorage.setItem(PERSIST_SECS, secs);
}

function getSeconds() {
    return Number($(SECS).text());
}
                     
function setContainerSize() {
    const MARGIN = 16;
    let browserWidth = $(window).width();
    let browserHeight = $(window).height();
    containerWidth = browserWidth - MARGIN;
    containerHeight = browserHeight - $('#header').outerHeight(true)
        - $('#title').outerHeight(true) - MARGIN;
}

function isShowing() {
    const img = $(IMG);
    return img.is(':visible') && img.width() > 0 && img.height() > 0;
}

function stopAuto() {
    if (isAuto()) {
        clearInterval(intervalId);
        intervalId = undefined;
        $(AUTO).prop('checked', false);
    }
}

function stopShow() {
    clearInterval(intervalId);
    if (audio) {
        audio.pause();
    }
    $(AUTO).prop('checked', false);
    intervalId = undefined;
}

function pauseAudio() {
    if (audio) {
        audio.pause();
    }
    $(SOUND).prop('checked', false);
}

function start() {
    let milliseconds = getSeconds() * 1000;
    if (isAuto() && !intervalId) {
        advance(true);
        intervalId = setInterval(function() {
            advance(true);
        }, milliseconds);
    }
    else {
        showImage();
    }
}

function advance(next) {
    if (next) {
        if (idxImg === undefined) {
            idxImg = -1;
        }
        idxImg++;
        if (idxImg >= IMGS.length) {
            idxImg = 0;
        }
    }
    else {
        if (idxImg === undefined) {
            idxImg = IMGS.length;
        }
        idxImg--;
        if (idxImg < 0) {
            idxImg = IMGS.length - 1;
        }
    }
    showImage();
}

function showImage() {
    const img = $(IMG);

    img[0].onload = function() {
        setTitle(IMGS[idxImg].title + " (" + (idxImg + 1) + "/" + IMGS.length + ")");
        alignImage(img);
        img.show();
        playMp3();
    };

    if (idxImg === undefined) {
        idxImg = 0;
    }
    img.attr("src", IMGS[idxImg].url);
}

function alignImage(img) {
    let imgWidth = img.prop('naturalWidth');
    let imgHeight = img.prop('naturalHeight');
    let arImg = imgWidth / imgHeight;
    let arScr = containerWidth / containerHeight;

    if (arImg <= arScr) {
        img.css({width:'unset', height:containerHeight + 'px'});
    }
    else {
        img.css({width:containerWidth + 'px', height:'unset'});
    }
}

function setTitle(text) {
    $('#title').text(text);
}

function playMp3() {  // https://audiotrimmer.com/
    if (isSound() && isShowing()) {
        if (audio) {
            if (audio.paused) {
                audio.play();
            }
        }
        else {
            audio = new Audio(currentTune());
            audio.play();
            audio.onended = function() {
                nextTune();
            };
        }
    }
    else if (audio) {
        audio.pause();
    }
}

function nextTune() {
    idxTunes++;
    if (idxTunes >= MP3S.length) {
        idxTunes = 0;
    }
    setTune();

    if (audio) {
        audio.src = currentTune();
        if (isSound() && isShowing()) {
            audio.play();
        }
    }
}

function isAuto() {
    return $(AUTO).is(':checked');
}

function isSound() {
    return $(SOUND).is(':checked');
}

function randomize(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }    
}
