'use strict'

// TODO: label for area node
// TODO: load your own audio btnXfeature — done!
// TODO: remove ID and type from note constructor (at least type)
// TODO: pretty look style
// TODO: mobile view — make touch events listeners
// TODO: ID generation — done!
// TODO: area-list click and sort (add timecodes or smth)
// TODO: make 'switch' instead of 'if' in Note class methods
// TODO: total check up LOL

 function save(filename, textInput) {
    var element = document.createElement('a');
    element.setAttribute('href','data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Notes

const list = [];

class Note {
    constructor(start, end, title, text, id, type, visualNode, textualNode) {
        this.start = start;
        this.end = end;
        this.title = title;
        this.text = text;
        if (this.end == null) {
            this.type = 'point';
        } else {
            this.type = 'area';
        }
        this.id = id;
        this.visualNode = visualNode;
        this.textualNode = textualNode;
    }

    remove() {
        if (this.textualNode) {
            this.textualNode.remove();
        }
        if (this.visualNode) {
            this.visualNode.remove();
        }
        var id = this.id;
        list.splice(list.findIndex((note) => {return note.id == id}, 1));
        deselect();
    }

    refresh() {
        this.title = document.getElementById('title').value;
        this.text = document.getElementById('note').value;
        if (this.type == 'area') {
            this.start = parseFloat(this.visualNode.style.marginLeft);
            this.end = this.start + parseFloat(this.visualNode.style.width);
            if (!this.textualNode) {
                this.createTextual();
            }
        }
        console.log('refreshed')
    }

    show() {
        var note = document.getElementById('note');
            note.value                         = this.text;
        document.getElementById('title').value = this.title
        heightControl(note);
    }

    createVisual() {
        if (this.type == 'point') {
            if (this.visualNode) { // if it exists refresh it
                this.visualNode.querySelector('.note-ref').innerHTML = document.getElementById('title').value;
            } else {
                var notes = document.querySelector('.note-ref-placeholder');
                var mark = document.createElement('div');
                    mark.className = 'note-ref-mark';
                var ref = document.createElement('div');
                    ref.className = 'note-ref';
                    ref.innerHTML = this.title;
                var div = document.createElement('div');
                    div.className = 'note-ref-wrapper';
                    div.style.marginLeft = this.start + '%';
                    div.setAttribute('id', this.id)
                    div.appendChild(mark);
                    div.appendChild(ref);
                notes.appendChild(div);
                this.visualNode = div;
            }
        }
        if (this.type == 'area') {
            var areas = document.getElementById('areas');
            var div = document.createElement('div');
                div.className = 'area';
                div.style.width = (this.end - this.start) + '%';
                div.style.marginLeft = this.start + '%';
                div.setAttribute('id', this.id)
            areas.appendChild(div);
            this.visualNode = div;
        }
    }

    createTextual() {
        if (this.type == 'point') {
            if (this.textualNode) { // if it exists refresh it
                this.textualNode.innerHTML = this.start + ': ' + this.title + '<br>' + this.text;
            } else {
                var container = document.getElementById('note-list');
                var div = document.createElement('div');
                    div.className = 'note';
                    div.innerHTML = Math.round((this.start/100)*audio.duration) + ': ' + this.title + '<br>' + this.text;
                    div.setAttribute('id', this.id)
                container.appendChild(div);
                this.textualNode = div;
            }
        }
        if (this.type == 'area') {
            if (this.textualNode) {  // if it exists refresh it
                this.textualNode.innerHTML = this.title + '<br>' + this.text;
            } else {
                var container = document.getElementById('area-list');
                var div = document.createElement('div');
                    div.className = 'note';
                    div.innerHTML = this.title + '<br>' + this.text;
                    div.setAttribute('id', this.id)
                container.appendChild(div);
                this.textualNode = div;
            }
        }
    }
}

const genID = () => new Promise ((resolve) => {
    setTimeout(() => {
        resolve(Date.now() * Math.random());
    }, 1)
})

function sortList() { // it is nessasary to be able to hover over the visualization of point notes (as they are stacking)
    list.sort((a, b) => {
        return a.start - b.start;
    })
    document.getElementById('note-list').replaceChildren();
    document.querySelector('.note-ref-placeholder').replaceChildren();
    list.forEach((note) => {
        if (note.type == 'point') {
            note.textualNode = null;
            note.visualNode = null;
            note.createTextual();
            note.createVisual();
        }
    });
}

function emptyNoteInput() {
    document.getElementById('title').value = '';
    document.getElementById('note').value = '';
}

function select(id) {
    console.log('select')
    if (currentNote && id != currentNote.id) {
        deselect();
    }
    currentNote = find(id);
    currentNote.visualNode.setAttribute('selected', '');
    currentNote.show();
    setTimeByPercent(currentNote.start);
    document.getElementById('write-btn').value = 'Save note';
    document.getElementById('erase-btn').style.visibility = 'visible';
}

function deselect() {
    console.log('deselect')
    emptyNoteInput();
    if (currentNote && currentNote.visualNode.hasAttribute('selected')) {
        currentNote.visualNode.removeAttribute('selected');
        currentNote = null;
    }
    document.getElementById('write-btn').value = 'Make note';
    document.getElementById('erase-btn').style.visibility = 'hidden';
}

function find(id) {
    var note = list.find((note) => {
        return note.id == id;
    });
    console.log(note)
    return note;
}

async function makeNote() {
    if (currentNote) {
        currentNote.refresh();
    } else {
        var title   = document.getElementById('title').value;
        var text    = document.getElementById('note').value;
        var start   = ((Math.round(audio.currentTime)) / audio.duration) * 100; // to seconds but perc as always
        if (list.find((note) => { return note.id == start; })) {
            console.log('There is already a note at this point')
            // ask if it is change
            return;
        }
        var id = await genID();
        var note = new Note(start, null, title, text, id);
            note.createVisual();
            note.createTextual();
        list.push(note);
        sortList();
        select(note.id);
    }
}

const temp = [];

function loadNotes(json) {
    list.splice(0, list.length);
    json.forEach((note) => temp.push(note));
    writeNotes();
}

function writeNotes() {
    document.getElementById('note-list').replaceChildren();
    document.querySelector('.note-ref-placeholder').replaceChildren();
    document.getElementById('area-list').replaceChildren();
    document.getElementById('areas').replaceChildren();
    temp.forEach((note) => {
        note = new Note (note.start, note.end, note.title, note.text, note.id, note.type, note.visualNode, note.textualNode);
        list.push(note);
        note.textualNode = null;
        note.visualNode = null;
        note.createTextual();
        note.createVisual();
    });
    temp.splice(0, temp.length);
}

// Annotating
// Building area

var buildingArea;

function buildStart(position) {
    position = ((position - document.getElementById('areas').getClientRects()[0].left) / viewportWidth) * 100;
    var areas = document.getElementById('areas')
    var area = document.createElement('div');
        area.className = 'area';
        area.style.marginLeft = position + '%';
    areas.appendChild(area)
    buildingArea = {node: area, start: position};
}

function building(position) {
    console.log('building')
    position = position - document.getElementById('areas').getClientRects()[0].left;
    var positionPerc = (position / viewportWidth) * 100;
    if (position <= 0) {
        buildingArea.node.style.marginLeft = '0%';
        buildingArea.node.style.width = buildingArea.start + '%';
        } else {
    if (position >= viewportWidth) {
        buildingArea.node.style.width = (100 - buildingArea.start) + '%';
        } else {
    if (buildingArea.start < positionPerc) {
        buildingArea.node.style.marginLeft = buildingArea.start + '%';
        buildingArea.node.style.width = (positionPerc - buildingArea.start) + '%';
        } else {
    if (buildingArea.start > positionPerc) {
        buildingArea.node.style.width = (buildingArea.start - positionPerc) + '%';
        buildingArea.node.style.marginLeft = positionPerc + '%';
        }
    }}}
}

function buildEnd(position) {
    position = position - document.getElementById('areas').getClientRects()[0].left;
    var positionPerc = (position / viewportWidth) * 100;
    if (buildingArea.start < positionPerc) {
        if (position > viewportWidth) {
            buildingArea.node.style.width = (100 - buildingArea.start) + '%';
            } else {
             buildingArea.node.style.width = (positionPerc - buildingArea.start) + '%';
            }
        } else {
    if (buildingArea.start > positionPerc) {
        if (position < 0) {
            buildingArea.node.style.width = buildingArea.start + '%';
            buildingArea.node.style.marginLeft = '0%';
            } else {
            buildingArea.node.style.width = (buildingArea.start - positionPerc) + '%';
            buildingArea.node.style.marginLeft = positionPerc + '%';
            }
        }
    }
    initArea();
}

// Registering the area
async function initArea() {
    var pxPerSec = viewportWidth / audio.duration;
    var width = buildingArea.node.offsetWidth;
    if (width <= pxPerSec || isNaN(width)) {
        buildingArea.node.remove();
        buildingArea = null;
        console.log('Area is too small');
        return;
    }
    var start = parseFloat(buildingArea.node.style.marginLeft);
    var end = parseFloat(buildingArea.node.style.width);
    var id = await genID();
    var note = new Note(start, start + end, null, null, id, null, buildingArea.node);
        note.visualNode.setAttribute('id', note.id);
        list.push(note);
        select(note.id);
        buildingArea = null;
    console.log(currentNote);
}

// Interactions
// Moving

function moving(movement) {
    var node = currentNote.visualNode;
    movement = (movement / viewportWidth) * 100;
    var width = parseFloat(node.style.width);
    var margin = parseFloat(node.style.marginLeft);
    if (width + margin + movement > 100) {
        node.style.marginLeft = (100 - width) + '%';
        return;
    }
    if (margin + movement < 0) {
        node.style.marginLeft = '0%'
        return;
    }
    node.style.marginLeft = parseFloat(node.style.marginLeft) + movement + '%';
}

function moveEnd() {
    console.log('moved')
    currentNote.refresh();
}

// Scaling

function scaleArea(move) {
    var node = currentNote.visualNode;
    var pxEdge = (currentNote.end / 100) * viewportWidth;
    var margin = parseFloat(node.style.marginLeft);
    var pxMargin = (margin / 100) * viewportWidth;
    var width = parseFloat(node.style.width);
    var pxWidth = (width / 100) * viewportWidth;
    var movePerc = (move / viewportWidth) * 100;
    switch(direction) {
        case 'left':
            if (margin + movePerc <= 0) {
                node.style.marginLeft = '0%';
                node.style.width = currentNote.end + '%';
                break;
            }
            if (pxMargin + move < pxEdge - 4) { // 4 is to keep ability to scale the area due to 3px that represent the edge in isEdge func
                node.style.marginLeft = (margin + movePerc) + '%';
                node.style.width = (width - movePerc) + '%';
            }
            break;
        case 'right':
            if (margin + width + movePerc >= 100) {
                node.style.width = (100 - margin) + '%';
                break;
            }
            if (pxWidth + move > 4) {
                node.style.width = (width + movePerc) + '%';
            }
            break;
    }
}

function scaleAreaEnd() {
    console.log('scaled')
    currentNote.refresh();
}

function isEdge(node, position) {
    var pxWidth = node.offsetWidth;
    if (position > pxWidth - 3) { // it can be more than 3 (according to screen size)
        direction = 'right'
        return true
    }
    if (position < 3) {
        direction = 'left'
        return true
    }
    return false;
}

// Player

var initialWidth;

function audioInit () {
    audio = document.getElementById('audio');
    initialWidth = audio.duration * 5; // 5px for each second is the based value
    var time = secToHMS(audio.duration);
    document.getElementById('time-duration').innerHTML = time.hours + ':' + time.minutes + ':' + time.seconds;
    document.querySelector('.visualization-wrapper').style.width = initialWidth + 'px';
    widthRenewer();
    initAllMarks();
}

function togglePlaying() {
    var audio = document.getElementById('audio');
    var control = document.getElementById('control');
    var play = control.innerHTML === 'Play'
    var method
  
    if (play) {
        control.innerHTML = 'Pause'
        method = 'play'
    } else {
        control.innerHTML = 'Play'
        method = 'pause'
    }
  
    audio[method]()
}

function updateProgress() {
    var style = document.body.style;
    var audio = document.getElementById('audio');
    var percentage = (audio.currentTime / audio.duration)*100;
    
    style.setProperty('--progress', percentage + '%');

    var time = secToHMS(audio.currentTime);
    document.getElementById('time-current').innerHTML = time.hours + ':' + time.minutes + ':' + time.seconds;
}

function secToHMS(secs) {
    var S = Math.floor(secs % 60);
    if (S.toString().length < 2) {
        S = '0' + S;
    }
    var M = Math.floor((secs / 60) % 60);
    if (M.toString().length < 2) {
        M = '0' + M;
    }
    var H = Math.floor(((secs / 60) / 60));
    if (H.toString().length < 2) {
        H = '0' + H;
    }
    return {seconds: S, minutes: M, hours: H}
}

function setTime(i) { //
    document.getElementById('audio').currentTime = i;
}

function setTimeByPercent(percent) {
    var time = (audio.duration / 100) * percent;
    audio.currentTime = time;
}

function setTimeByPageX(pageX) {
    var position = pageX - document.getElementById('progress-wrapper').getClientRects()[0].left;
    var percentage = (position / viewportWidth) * 100;
    setTimeByPercent(percentage);
}

function playbackRate(rate) {
    var audio = document.getElementById('audio');
    audio.playbackRate = rate;
}

// Ruler

function initAllMarks() {
    var markTypes = [1, 5, 10, 15, 30, 60, 120]
    var ruler = document.querySelector('.ruler')
        ruler.replaceChildren();
    markTypes.forEach(function(type, indx) {
        var ceilQ = Math.ceil(audio.duration / type);
        var box = document.createElement('div');
            box.setAttribute('class', 'box');
            box.setAttribute('id', 'mark-' + indx);
            box.style.display = 'none';
        ruler.appendChild(box);
        for (var i = 0; i < ceilQ; i++) {
            var mark = document.createElement('div');
                mark.setAttribute('class', 'mark-' + indx);
                mark.innerHTML = type * i;
            box.appendChild(mark);
        }
        var style = document.body.style;
        var percPerMark = (type / audio.duration) * 100;
        style.setProperty('--mark-' + indx, percPerMark + '%');
        
            box.style.width = (ceilQ * percPerMark) + '%';
    });
    marksControl();
}

function marksControl() {
    var width = parseFloat(document.querySelector('.visualization-wrapper').style.width);
    var secPerMark = 50 / (width / audio.duration);
    var prevMarks = document.querySelector('[shown]');
    if (prevMarks) {
        prevMarks.style.display = 'none';
        prevMarks.removeAttribute('shown');
    }
    if (secPerMark < 2) {
        var marksToShow = document.getElementById('mark-0')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 7) {
        var marksToShow = document.getElementById('mark-1')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 13) {
        var marksToShow = document.getElementById('mark-2')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 19) {
        var marksToShow = document.getElementById('mark-3')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 35) {
        var marksToShow = document.getElementById('mark-4')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 66) {
        var marksToShow = document.getElementById('mark-5')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    } else {
    if (secPerMark < 127) {
        var marksToShow = document.getElementById('mark-6')
            marksToShow.style.display = 'flex';
            marksToShow.setAttribute('shown', '');
    }
    }}}}}}
}