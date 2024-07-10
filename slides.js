/*
    Slides project start date: July 2, 2024
*/

const IMG = "#image";
const START = "#start";
const AUTO = "#cbAuto";
const SOUND = "#cbSound";
const SECS = "#seconds";
const TUNE = "#tunes";
const PERSIST_SECS = "seconds";
const PERSIST_AUTO = "auto";
const PERSIST_SOUND = "sound";

let intervalId;
let idxImg = undefined;
let idxTunes = 0;
let audio;
let containerWidth;
let containerHeight;

function init() {
    const img = $(IMG);

    randomize(IMGS);
    randomize(TUNES);
    setContainerSize();
    initControls();

    $(START).on('click', function() {
        $(START).blur();  // Remove focus
        $(AUTO).prop('checked', true);
        $('#imgContainer')[0].requestFullscreen();
        start();
    });

    $(SECS).click(function() {
        clickSeconds();
    });

    $(SOUND).on('click', function() {
        persistSound();
        if (isSound()) {
            audio = undefined;
            if (isShowing(img)) {
                playMp3(true);
            }
        }
        else {
            if (audio) {
                audio.pause();
                audio = undefined;
            }
        }
    });

    $(AUTO).on('click', function() {
        persistAuto();
        if (isAuto()) {
            start();
        }
        else if (intervalId) {
            clearInterval(intervalId);
            intervalId = undefined;
        }
    });

    $(document).keydown(function(event) {
        if (event.key === "ArrowLeft" || event.keyCode === 37) {
            stopAuto();
            advance(false);
        }
        else if (event.key === "ArrowRight" || event.keyCode === 39) {
            stopAuto();
            advance(true);
        }
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

function changeTune() {
    idxTunes = $(TUNE).val();
    if (audio && !audio.paused) {
        audio.pause();
        audio = undefined;
        playMp3();
    }
    if (audio && isSound()) {
        audio.pause();
        audio = undefined;
    }
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

    let auto = localStorage.getItem(PERSIST_AUTO);
    if (auto) {
        $(AUTO).prop('checked', "true" === auto);
    }
    else {
        persistAuto();
    }

    let sound = localStorage.getItem(PERSIST_SOUND);
    if (sound) {
        $(SOUND).prop('checked', "true" === sound);
    }
    else {
        persistSound();
    }

    $("#auto").attr('title', IMGS.length + " photos");
    initPicklist();
}

function initPicklist() {
    var $tunes = $(TUNE);

    for (var i = 0; i < TUNES.length; i++) {
        var title = TUNES[i];
        let $opt = $('<option></option>');
        $opt.attr('value', i);
        $opt.text(title);
        $tunes.append($opt);
    }
}

function setTune() {
    $(TUNE).val(idxTunes);
}

function persistSound() {
    let checked = $(SOUND).prop('checked');
    localStorage.setItem(PERSIST_SOUND, checked);
}

function persistAuto() {
    let checked = $(AUTO).prop('checked');
    localStorage.setItem(PERSIST_AUTO, checked);
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

function isShowing(img) {
    return img.is(':visible') && img.width() > 0 && img.height() > 0;
}

function stopAuto() {
    if (isAuto()) {
        clearInterval(intervalId);
        intervalId = undefined;
        $(AUTO).prop('checked', false);
        persistAuto();
    }
}

function stopShow() {
    clearInterval(intervalId);
    if (audio) {
        audio.pause();
        $(SOUND).prop('checked', false);
    }
    $(AUTO).prop('checked', false);
    intervalId = undefined;
    audio = undefined;
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

function playMp3(click) {  // https://audiotrimmer.com/
    if (audio) {
        if (audio.paused && click) {
            audio.play();
        }
    }
    else {
        audio = new Audio('sounds/' + TUNES[idxTunes] + '.mp3');
        audio.volume = isSound() ? 1 : 0;
        audio.play();
        audio.onended = function() {
            idxTunes++;
            if (idxTunes >= TUNES.length) {
                idxTunes = 0;
            }
            setTune();
            audio = undefined;
            playMp3();
        };
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
