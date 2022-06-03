'use strict'

 // TODO: Link all service functions of Notes and Areas to corresponding classes
 // TODO: Optimize the variables

 function save(filename, textInput) {
    var element = document.createElement('a');
    element.setAttribute('href','data:text/plain;charset=utf-8, ' + encodeURIComponent(textInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Timestamped notes

const notes = [];

class Note {
    constructor(timestamp, text, sign) {
        this.timestamp = timestamp;
        this.text = text;
        this.sign = sign;
    }
}

function annotate(text, sign) {
    var timestamp = parseInt(document.getElementById('audio').currentTime);
    if (notes.find((note) => { return note.timestamp == timestamp; })) {
        console.log('There is already a note at this point')
        return;
    }
    currentNote = new Note (timestamp, text, sign);
    notes.push(currentNote);
    addNote(currentNote);
}

function showNote() {
    document.getElementById('note').value = currentNote.text;
    document.getElementById('sign').value = currentNote.sign
}

function noteClick(id, node) {
    currentNote = findNote(id);
    currentNoteNode = node;
    setTime(id);
    showNote();
    currentArea = null;
    currentAreaNode = null;
}

function writeNotes() {
    console.log('write notes is called')
    var container = document.getElementById('notes');
    container.replaceChildren();
    notes.forEach((note) => {
        var div = document.createElement('div');
            div.className = 'note';
            div.innerHTML = note.timestamp + ': ' + note.text + ' (' + note.sign + ')';
            div.setAttribute('i', note.timestamp)
        container.appendChild(div);
        console.log('appended')
    });
}

function addNote(note) {
    var container = document.getElementById('notes');
    var div = document.createElement('div');
        div.className = 'note';
        div.innerHTML = note.timestamp + ': ' + note.text + ' (' + note.sign + ')';
        div.setAttribute('i', note.timestamp)
        currentNoteNode = div;
    container.appendChild(div);
}

function findNote(i) {
    var note = notes.find((note) => {
        return note.timestamp == i;
    });
    return note;
}


function removeNote() {
    var i = parseInt(currentNoteNode.getAttribute('i'));
    notes.splice(notes.findIndex((note) => note.timestamp == i), 1);
    currentNote = null;
    eraseNote();
}

function eraseNote() {
    currentNoteNode.remove();
    currentNoteNode = null;
}

function loadNotes(json) {
    notes.splice(0, notes.length);
    json.forEach((note) => notes.push(note));
    writeNotes();
}

// Player

var initialWidth;

function audioInit () {
    audio = document.getElementById('audio');
    initialWidth = audio.duration * 5; // 5px for each second is the based value
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
}

function setTime(i) {
    document.getElementById('audio').currentTime = i;
}

function changeTime(position) { // setTime with time conversion
    position = position - document.getElementById('progress-wrapper').getClientRects()[0].left;
    var audio = document.getElementById('audio');
    var duration = audio.duration;

    var percentage = duration / viewportWidth;
    var progress = (position * percentage);
    audio.currentTime = progress;
}

function playbackRate(rate) {
    var audio = document.getElementById('audio');
    audio.playbackRate = rate;
}

// Annotating
// Selecting area

const areanotes = [];
class Area {
    constructor(node, start, end, label, note, id) {
        this.node = node;
        this.start = start;
        this.end = null;
        this.label = null;
        this.note = null;
        this.id = null;
    }
}

function selectStart(position) {
    position = ((position - document.getElementById('areas').getClientRects()[0].left) / viewportWidth) * 100;
    var areas = document.getElementById('areas')
    var area = document.createElement('div');
        area.className = 'area';
        area.style.marginLeft = position + '%';
    areas.appendChild(area)
    currentArea = new Area(area, position);
}

function selecting(position) {
    position = position - document.getElementById('areas').getClientRects()[0].left;
    var positionPerc = (position / viewportWidth) * 100;
    if (position <= 0) {
        currentArea.node.style.marginLeft = '0%';
        currentArea.node.style.width = currentArea.start + '%';
        } else {
    if (position >= viewportWidth) {
        currentArea.node.style.width = (100 - currentArea.start) + '%';
        } else {
    if (currentArea.start < position) {
        currentArea.node.style.marginLeft = currentArea.start + '%';
        currentArea.node.style.width = (positionPerc - currentArea.start) + '%';
        } else {
    if (currentArea.start > position) {
        currentArea.node.style.width = (currentArea.start - positionPerc) + '%';
        currentArea.node.style.marginLeft = positionPerc + '%';
        }
    }}}
}

function selectEnd(position) {
    position = position - document.getElementById('areas').getClientRects()[0].left;
    var positionPerc = (position / viewportWidth) * 100;
    if (currentArea.start < positionPerc) {
        if (position > viewportWidth) {
            currentArea.node.style.width = (100 - currentArea.start) + '%';
            } else {
            currentArea.node.style.width = (positionPerc - currentArea.start) + '%';
            }
        } else {
    if (currentArea.start > positionPerc) {
        if (position < 0) {
            currentArea.node.style.width = currentArea.start + '%';
            currentArea.node.style.marginLeft = '0%';
            } else {
            currentArea.node.style.width = (currentArea.start - positionPerc) + '%';
            currentArea.node.style.marginLeft = positionPerc + '%';
            }
        }
    }
    // Registering the area
    var pxPerSec = viewportWidth / audio.duration;
    var width = currentArea.node.offsetWidth;
    if (width <= pxPerSec || isNaN(width)) {
        currentArea.node.remove();
        console.log('Area is too small');
        return;
    }
    var start = parseFloat(currentArea.node.style.marginLeft);
    var end = parseFloat(currentArea.node.style.width);
    currentArea.end = start + end;
    currentArea.start = start;

    var id = currentArea.start + ':' + currentArea.end;
    currentArea.id = id;
    currentArea.node.setAttribute('id', id)
    areanotes.push(currentArea);
    currentAreaNode = currentArea.node;
    delete currentArea.node;
    console.log(currentArea)
}

// Interact with areas

function findArea(id) {
    var area = areanotes.find((area) => {
        return area.id == id;
    });
    return area;
}

function showAreaNote() {
    document.getElementById('note').value = currentArea.note;
}

function areaClick(id, node) {
    currentArea = findArea(id);
    currentAreaNode = node;
    changeTime(((currentArea.start / 100) * viewportWidth) + document.getElementById('areas').getClientRects()[0].left)
    showAreaNote();
    currentNote = null;
    currentNoteNode = null;
}

// Moving

function moveStart(node, id) {
    currentArea = findArea(id);
    currentAreaNode = node;
}

function moving(movement) {
    movement = (movement / viewportWidth) * 100;
    var width = parseFloat(currentAreaNode.style.width);
    var margin = parseFloat(currentAreaNode.style.marginLeft);
    if (width + margin + movement > 100) {
        currentAreaNode.style.marginLeft = (100 - width) + '%';
        return;
    }
    if (margin + movement < 0) {
        currentAreaNode.style.marginLeft = '0%'
        return;
    }
    currentAreaNode.style.marginLeft = parseFloat(currentAreaNode.style.marginLeft) + movement + '%';
}

function moveEnd() {
    console.log('moved')
    currentArea.start = parseFloat(currentAreaNode.style.marginLeft);
    currentArea.end = currentArea.start + parseFloat(currentAreaNode.style.width);
    currentArea.id = currentArea.start + ':' + currentArea.end;
    currentAreaNode.setAttribute('id', currentArea.start + ':' + currentArea.end);
}

// Scaling

function scaleAreaStart(node, id) {
    currentArea = findArea(id);
    currentAreaNode = node;
}

function scaleArea(move) {
    var pxEdge = (currentArea.end / 100) * viewportWidth;
    var margin = parseFloat(currentAreaNode.style.marginLeft);
    var pxMargin = (margin / 100) * viewportWidth;
    var width = parseFloat(currentAreaNode.style.width);
    var pxWidth = (width / 100) * viewportWidth;
    var movePerc = (move / viewportWidth) * 100;
    switch(direction) {
        case 'left':
            if (margin + movePerc <= 0) {
                currentAreaNode.style.marginLeft = '0%';
                currentAreaNode.style.width = currentArea.end + '%';
                break;
            }
            if (pxMargin + move < pxEdge - 4) { // 4 is to keep ability to scale the area due to 3px that represent the edge in isEdge func
                currentAreaNode.style.marginLeft = (margin + movePerc) + '%';
                currentAreaNode.style.width = (width - movePerc) + '%';
            }
            break;
        case 'right':
            if (margin + width + movePerc >= 100) {
                currentAreaNode.style.width = (100 - margin) + '%';
                break;
            }
            if (pxWidth + move > 4) {
                currentAreaNode.style.width = (width + movePerc) + '%';
            }
            break;
    }
}

function scaleAreaEnd() {
    currentArea.start = parseFloat(currentAreaNode.style.marginLeft);
    currentArea.end = currentArea.start + parseFloat(currentAreaNode.style.width);
    currentArea.id = currentArea.start + ':' + currentArea.end;
    currentAreaNode.setAttribute('id', currentArea.start + ':' + currentArea.end);
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

// Areas service functions

function removeArea() {
    var id = currentArea.id;
    areanotes.splice(areanotes.findIndex((area) => {return area.id == id}, 1));
    currentArea = null;
    eraseArea()
}

function eraseArea() {
    currentAreaNode.remove();
    currentAreaNode = null;
}

function labelArea() {
    // create div that is a label for the current area
}

function annotateArea(text) {
    currentArea.note = text;
}

function loadAreas(json) {
    console.log(json)
    areanotes.splice(0, areanotes.length);
    json.forEach((note) => areanotes.push(note));
    writeAreas();
}

function writeAreas() {
    var areas = document.getElementById('areas');
    areanotes.forEach(area => {
        var div = document.createElement('div');
            div.className = 'area';
            div.style.width = (area.end - area.start) + '%';
            div.style.marginLeft = area.start + '%';
            div.setAttribute('id', area.id)
        areas.appendChild(div)
    });
}

// Ruler

function initAllMarks() {
    var markTypes = [1, 5, 10, 15, 30, 60, 120]
    var ruler = document.querySelector('.ruler')
    markTypes.forEach(function(type, indx) {
        var floorQ = Math.floor(audio.duration / type);
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