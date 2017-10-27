
let MTC = [];
let MTC_Counter = 0;
let MTC_currentFrame = 0;
let MTC_lastTimestamp = 0;

let projectData;
let songCurrent;
let songNext;
let partCurrent;
let partNext;

let lastSixteenth = 0;

let zoom = 1;
let FPS = 25;
let overviewRatio = 1;
let timelineWidth;

let timelineLoop = false;
let timelineLoopCount = 0;

let screenSmpte = document.querySelector('.smpte');
let screenBars = document.querySelector('.bars');
let screenBpm = document.querySelector('.bpm');
let timelineCountdown = document.querySelector('.timelineCountdown');
let timeline = document.querySelector('.timeline');
let detailInfos = document.querySelector('.details');

let overviewTimeline = document.querySelector('.overviewTimeline');
let overviewPosMarker = document.querySelector('.overviewPosMarker');


loadProject();

//Load the Project
function loadProject(){
  fetch("SofaSurfers2017.js")
  .then(response => response.json())
  .then((json) => {
      console.log(json);
      projectData = json;
      drawProject(projectData);
  });
}

//Draw the project
function drawProject(projectData){

  //bind Zoom Select
  document.querySelector("#zoomSelect").onchange = setZoom;

  drawTimeline(projectData);
  drawTimelineOverview(projectData);
}

function setZoom(e){
  let s = e.target;
  let currentFrame = Math.round((timeline.scrollLeft / zoom) + (timeline.offsetWidth / 2))  - timelineWidth;
  zoom = s.options[s.selectedIndex].value;
  drawTimeline(projectData, currentFrame);
}

//Draw the timeline
function drawTimeline(projectData, currentFrame=0){
  timeline.innerHTML = '';

  timelineWidth = Math.round(timeline.offsetWidth / 2);

  //draw timeline position marker
  let timelineContainer = document.querySelector('.timelineContainer');
  let timeLinePosMarker = document.querySelector('.timelinePosMarker');
  timeLinePosMarker.style.left = ((timelineContainer.offsetWidth / 2) - (timeLinePosMarker.offsetWidth / 2)) + "px";


  //draw countdown box
  timelineCountdown.style.left = parseInt(timeLinePosMarker.style.left.replace("px", "")) - timelineCountdown.offsetWidth + "px";
  //draw songs
  projectData.songs.forEach(song => {

    let boxSong = document.createElement('div');
    boxSong.className = "song";
    boxSong.style.left = timelineWidth + (song.SMPTEStartFrame * zoom) + "px";
    timeline.appendChild(boxSong);

    //draw BeatRuler
    let songBeatRuler = document.createElement('div');
    songBeatRuler.className = "songBeatRuler";
    boxSong.appendChild(songBeatRuler);

    let songLength = 0;

    song.parts.forEach(part => {

      let boxPart = document.createElement('div');
      boxPart.className = "songPart";
      boxPart.style.width = (((FPS / ((song.bpm * 4) / 60)) * part.length) * zoom) + "px";
      boxPart.style.backgroundColor = part.color;
      let boxText = document.createElement('div');
      boxText.className = "songPartText";
      let text = part.name + "<br/><br/>";
      text += part.notes;
      boxText.innerHTML = text;
      boxPart.appendChild(boxText);
      boxSong.appendChild(boxPart);

      part.startSixteenth = songLength;

      songLength += part.length;

    })
    //store SMPTEEndFrame
    song.SMPTEEndFrame = song.SMPTEStartFrame + Math.round(songLength * (FPS / ((song.bpm * 4) / 60)));
    //console.log(song.SMPTEStartFrame + " -> " + song.SMPTEEndFrame);

    //draw BeatRuler Sections
    for(let i = 0; i < songLength / 4; i++ ){
      let divider = document.createElement('div');
      divider.className = "beatRulerDivider";
      divider.style.left = (i * (FPS / (song.bpm / 60)) * zoom) + "px";
      if (i % 4 === 0)
        divider.style.height = "20px"
      songBeatRuler.appendChild(divider);
    }

  })

  //add emptyBox at the START of timeline for correct scrolling
  let emptyBox = document.createElement('div');
  emptyBox.className = "timelineEmptyBox";
  emptyBox.style.left = "0px";
  emptyBox.style.width = timelineWidth + "px";
  timeline.appendChild(emptyBox);

  //add empty box at the END of timeline for correct scrolling
  emptyBox = document.createElement('div');
  emptyBox.className = "timelineEmptyBox";
  console.log("SMPTEEndFrame" + projectData.songs[projectData.songs.length - 1].SMPTEEndFrame);
  emptyBox.style.left = ((projectData.songs[projectData.songs.length - 1].SMPTEEndFrame * zoom) + 1 + timelineWidth) + "px";
  emptyBox.style.width = timelineWidth + "px";
  timeline.appendChild(emptyBox);

  //add eventhandler to scrollbar
  timeline.onscroll = changeSongPosition;
  //add eventhandler to overview timeline
  overviewTimeline.onmousedown = changeSongPosition;

  timeline.scrollLeft = (currentFrame * zoom);
}

function changeSongPosition(e){
  let currentFrame = 1;
  if (e.target.className == "timeline"){
    currentFrame = Math.round((timeline.scrollLeft / zoom) + (timeline.offsetWidth / 2))  - timelineWidth;
    setOverviewPosMarker(currentFrame);
  } else {
    currentFrame = Math.round((e.pageX - overviewTimeline.offsetLeft) / overviewRatio);
    setTimelinePosMarker(currentFrame);
  }



  setCurrentSong(currentFrame);

  drawSmpte(currentFrame);
  drawBars(currentFrame);


  console.log("changeSongPosition called!!!");
}

function drawSmpte(currentFrame){
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let frames = 0;

  if (currentFrame >= 0){
    let s = Math.floor(currentFrame / FPS);
    frames = currentFrame % FPS;

    hours = Math.floor(s / 3600);
    s = s % 3600;
    minutes = Math.floor(s / 60);
    s = s % 60;
    seconds = s;
  }
  screenSmpte.innerText = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + ":" + frames.toString().padStart(2, "0");
}

function drawBars(currentFrame){
  if (songCurrent !== undefined){
    let framesSum = currentFrame - songCurrent.SMPTEStartFrame;
    let sixteenths = framesToSixteenths(framesSum);

    if(sixteenths !== lastSixteenth){

      lastSixteenth = sixteenths;

      let st = sixteenths;
      let BAR = Math.floor(st / 16) + 1;
      st = st % 16;
      let BEAT = Math.floor(st / 4) + 1;
      let DIV = st % 4 + 1;

      screenBars.innerText = BAR + ":" + BEAT + ":" + DIV;

      //bpm flashing
      if (DIV == 1){
        if (BEAT == 1)
          screenBpm.classList.add("bpmFlashOne");
        else
          screenBpm.classList.add("bpmFlash");
      } else {
        screenBpm.classList.remove("bpmFlash");
        screenBpm.classList.remove("bpmFlashOne");
      }

      console.log("sixs: " + sixteenths);

      setCurrentPart(sixteenths);

      //Countdown on the last bar of the part
      if (sixteenths >= partCurrent.startSixteenth + partCurrent.length - (4 * songCurrent.timeSignature)){
        timelineCountdown.innerText = BEAT;
        console.log(BEAT);
      } else {
        timelineCountdown.innerText = "";
      }
    }

  } else {
    screenBars.innerText = "----:-:-";
    timelineCountdown.innerText = "";
  }

}

function drawTimelineOverview(projectData){
  let overview = document.querySelector('.overviewTimeline');

  //get Length of Project
  let projectLength = projectData.songs[projectData.songs.length - 1].SMPTEEndFrame;
  overviewRatio = overview.offsetWidth / projectLength;

  projectData.songs.forEach(song => {

    let boxSong = document.createElement('div');
    boxSong.className = "overviewSong";
    boxSong.style.left = song.SMPTEStartFrame * overviewRatio + "px";
    overview.appendChild(boxSong);

    song.parts.forEach(part => {

      let boxPart = document.createElement('div');
      boxPart.className = "overviewSongPart";
      boxPart.style.width = (((FPS / ((song.bpm * song.timeSignature) / 60)) * part.length) * overviewRatio) + "px";
      boxPart.style.backgroundColor = part.color;
      boxSong.appendChild(boxPart);

    });

  });

}

function setTimelinePosMarker(currentFrame){
  timeline.scrollLeft = (currentFrame * zoom) + timelineWidth - (timeline.offsetWidth / 2);
}

function setOverviewPosMarker(currentFrame){
  let pos = currentFrame * overviewRatio;
  if (pos <= 0)
    pos = overviewPosMarker.offsetWidth / 2;
  if (pos >= overviewTimeline.offsetWidth)
   pos = overviewTimeline.offsetWidth - overviewPosMarker.offsetWidth / 2;

  overviewPosMarker.style.left = Math.round(pos - (overviewPosMarker.offsetWidth / 2)) + "px";
}


function loopTimeline(){
  let currentTimestamp = Date.now();

  let currentFrame = Math.round(MTC_currentFrame + ((currentTimestamp - MTC_lastTimestamp) / (1000/FPS)));

  //test for currentSong
  setCurrentSong(currentFrame);

  setTimelinePosMarker(currentFrame);
  setOverviewPosMarker(currentFrame);
  drawBars(currentFrame);

  //test if timecode recieved
  if(currentFrame > MTC_currentFrame + 4){
    clearInterval(timelineLoop);
    timelineLoop = false;

    //add eventhandlers for manual changing the song position
    timeline.onscroll = changeSongPosition;
    overviewTimeline.onmousedown = changeSongPosition;

    console.log("Interval cleared!");
  }
}

function framesToSixteenths(frames){
  return Math.floor(frames / (FPS / (songCurrent.bpm * songCurrent.timeSignature / 60)))
}

function sixteenthsToFrames(sixteenths){
  return Math.floor(FPS / ((songCurrent.bpm * songCurrent.timeSignature) / 60) * sixteenths);
}

function setCurrentPart(sixteenths){
  if(partCurrent == undefined || sixteenths < partCurrent.startSixteenth || sixteenths >= partCurrent.startSixteenth + partCurrent.length){
    console.log("searching for current part! " + sixteenths);
    partCurrent = songCurrent.parts.find(part => {
      if(sixteenths >= part.startSixteenth && sixteenths < part.startSixteenth + part.length)
        return true;
    })
    partNext = songCurrent.parts.find(part =>{
      if(sixteenths < part.startSixteenth)
        return true;
    })

    //if current part is the last in the song get first part of the next song if available
    if(partNext == undefined && songNext !== undefined)
      partNext = songNext.parts[0];

    drawInfoDetails();
  }
}

function drawInfoDetails(){
  console.log("drawInfoDetails");
  if(partCurrent !== undefined){
    detailInfos.querySelector(".partDetail.left > .title").innerText = partCurrent.name;
    detailInfos.querySelector(".partDetail.left > .title").style.backgroundColor = partCurrent.color;
    detailInfos.querySelector(".partDetail.left > .notes").innerHTML = partCurrent.notes;
  } else {
    detailInfos.querySelector(".partDetail.left > .title").innerText = "---";
    detailInfos.querySelector(".partDetail.left > .title").style.backgroundColor = "inherit";
    detailInfos.querySelector(".partDetail.left > .notes").innerHTML = "---";
  }

  if (partNext !== undefined){
    detailInfos.querySelector(".partDetail.right > .title").innerText = partNext.name;
    detailInfos.querySelector(".partDetail.right > .title").style.backgroundColor = partNext.color;
    detailInfos.querySelector(".partDetail.right > .notes").innerHTML = partNext.notes;
  } else {
    detailInfos.querySelector(".partDetail.right > .title").innerText = "---";
    detailInfos.querySelector(".partDetail.right > .title").style.backgroundColor = "inherit";
    detailInfos.querySelector(".partDetail.right > .notes").innerHTML = "---";
  }

  if (songCurrent !== undefined){
    detailInfos.querySelector(".songDetail.left > .title").innerText = songCurrent.name;
    detailInfos.querySelector(".songDetail.left > .notes").innerText = songCurrent.notes;
  }
  if (songNext !== undefined){
    detailInfos.querySelector(".songDetail.right > .title").innerText = songNext.name;
    detailInfos.querySelector(".songDetail.right > .notes").innerText = songNext.notes;
  }

}

/*
function setCurrentPart(currentFrame){
  if(partCurrent == undefined || currentFrame < (songCurrent.SMPTEStartFrame + sixteenthsToFrames(partCurrent.startSixteenth)) || currentFrame > (songCurrent.SMPTEStartFrame + sixteenthsToFrames(partCurrent.startSixteenth + partCurrent.length))){
    console.log("searching for current part! " + currentFrame);
    partCurrent = songCurrent.parts.find(part => {
      if(currentFrame >= songCurrent.SMPTEStartFrame + sixteenthsToFrames(part.startSixteenth) && currentFrame <= songCurrent.SMPTEStartFrame + sixteenthsToFrames(part.startSixteenth + part.length))
        return true;
    })
    partNext = songCurrent.parts.find(part =>{
      if(currentFrame < songCurrent.SMPTEStartFrame + sixteenthsToFrames(part.startSixteenth))
        return true;
    })
    console.log(partCurrent);
    console.log(partNext);
  }

}
*/

function setCurrentSong(currentFrame){
  //get the song where the current frame is in range of start and end frame of the song
  if (songCurrent == undefined || (songCurrent.SMPTEStartFrame > currentFrame || songCurrent.SMPTEEndFrame < currentFrame)){

    console.log("searching for current song! " + currentFrame);

    songCurrent = projectData.songs.find(song => {
      if(song.SMPTEStartFrame <= currentFrame && song.SMPTEEndFrame >= currentFrame)
        return true;
    });

    if (songCurrent == undefined){
      songNext = projectData.songs.find(song => {
        if (song.SMPTEStartFrame > currentFrame)
          return true;
      });
    } else {
      songNext = projectData.songs.find(song => {
        if(song.SMPTEStartFrame > songCurrent.SMPTEEndFrame)
          return true;
      })
    }

    //Draw song infos
    if (songCurrent !== undefined){
      document.querySelector('.currentSongName').innerText = songCurrent.name;
      document.querySelector('.bpm').innerText = songCurrent.bpm.toString().padStart(3, " ");
    } else {
      document.querySelector('.currentSongName').innerText = "---";
      document.querySelector('.bpm').innerText = "---";
      screenBpm.classList.remove("bpmFlash");
      screenBpm.classList.remove("bpmFlashOne");
    }

    if(songNext !== undefined){
      document.querySelector('.nextSongName').innerText = songNext.name;
    } else {
      document.querySelector('.nextSongName').innerText = "---";
    }

    //if no current song, load the part of the next song if possible
    if(songCurrent == undefined && songNext !== undefined){
      partCurrent = undefined;
      partNext = songNext.parts[0];
      drawInfoDetails();
    }
  }
}

function setMTC(quarterFrame){
  let qfID = quarterFrame >> 4;
  let qfValue = quarterFrame & 0xF;

  if (qfID === MTC_Counter){
    MTC[qfID] = qfValue;
    MTC_Counter++;
    if (MTC_Counter === 8){
      //draw time string
      let frames = (MTC[1] << 4) + MTC[0];
      let seconds = (MTC[3] << 4) + MTC[2];
      let minutes = (MTC[5] << 4) + MTC[4];
      let hours = (MTC[6] + (16 * (MTC[7] & 1)));

      let currentFrame = frames + (seconds * FPS) + (minutes * 60 * FPS) + (hours * 60 * 60 * FPS);

      //drawSmpte(hours, minutes, seconds, frames);
      drawSmpte(currentFrame);

      //sync timeline
      MTC_currentFrame = currentFrame;
      MTC_lastTimestamp = Date.now();

      //activate timeline loop
      if (timelineLoop == false){
        timeline.onscroll = false;
        overviewTimeline.onmousedown = false;
        timelineLoop = setInterval(loopTimeline, (1000/FPS)/5);
        console.log("starting loop: " + timelineLoop);
      }

      MTC_Counter = 0;
      MTC = [];
    }
  }

}

if (navigator.requestMIDIAccess) {
    console.log('Browser supports MIDI!');

    navigator.requestMIDIAccess({ sysex: true })
        .then(success, failure);
}

function success(midi){

  let listMap = midi.inputs;
  let listStr = "";
  listMap.forEach(port => listStr += port.name + "\n");

  let inp = midi.inputs.values();
  let i = inp.next();
  i = inp.next();
  i.value.onmidimessage = onMIDIMessage;
  console.log("All Devices:\n" + listStr);
  console.log("Active Port: " + i.value.name);
  console.log("SysEx? " + JSON.stringify(midi.sysexEnabled));
}

function onMIDIMessage(msg){

  if(msg.data[0] === 241){
    setMTC(msg.data[1]);
  }

}

function failure () {
    alert('No access to your midi devices.')
}
