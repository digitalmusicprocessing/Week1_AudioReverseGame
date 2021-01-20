let mediaRecorder = null;
let audio = null;
let revAudio = null;
let recorder = null;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

function startRecording() {
  recorder = new Promise(resolve => {
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    startButton.disabled = true;
    stopButton.disabled = false;
    let chunks = [];
  
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      function(stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.addEventListener("dataavailable", event => {
          chunks.push(event.data);
        });
        mediaRecorder.addEventListener("stop", () => {
          resolve(chunks);
        })
        mediaRecorder.start();
      }
    );
  })
}

let audioBlob = null;
let samples = [];
let sr = 44100;

function stopRecording() {
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  startButton.disabled = false;
  stopButton.disabled = true;

  mediaRecorder.stop();
  recorder.then(chunks => {
    audioBlob = new Blob(chunks, {type:'audio/mp3'});
    const audioUrl = URL.createObjectURL(audioBlob);
    audio = new Audio(audioUrl);
    // Now plot and make reversed audio
    audioBlob.arrayBuffer().then(
      buffer => {
        audioContext.decodeAudioData(buffer, function(buff) {
          sr = buff.sampleRate;
          samples= buff.getChannelData(0);
          let xs = [];
          let ys = [];
          for (let i = 0; i < samples.length; i++) {
            xs.push(i/sr);
            ys.push(samples[i]);
          }
          let plot = {x:xs, y:ys}
          let layout = {title:'Audio samples',
                        autosize: false,
                        width: 800,
                        height: 400};
          Plotly.newPlot("audioPlot", [plot], layout);
        });
        
      }
    );
  });

}

function playAudio() {
  audio.play();
}

function playReversed() {
  const N = samples.length;
  let myArrayBuffer = audioContext.createBuffer(1, N, sr);
  let audio = myArrayBuffer.getChannelData(0);
  for (let i = 0; i < N; i++) {
    audio[i] = samples[N-i-1];
  }
  let source = audioContext.createBufferSource();
  // set the buffer in the AudioBufferSourceNode
  source.buffer = myArrayBuffer;
  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(audioContext.destination);
  // start the source playing
  source.start();
}

function download() {
  const url = window.URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'audio.mp3';
  document.body.appendChild(a);
  a.click();
}



function downloadReversed() {
  let N = samples.length;
  // interleaved
  const audio = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    audio[i] = samples[N-i-1];
  }
  // get WAV file bytes and audio params of your audio source
  const wavBytes = getWavBytes(audio.buffer, {
    isFloat: true,       // floating point or 16-bit integer
    numChannels: 1,
    sampleRate: sr,
  })
  const wav = new Blob([wavBytes], { type: 'audio/wav' });
  
  // create download link and append to Dom
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(wav);
  a.style.display = 'none';
  a.download = 'audioRev.wav';
  document.body.appendChild(a);
  a.click();

}