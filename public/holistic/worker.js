let ttttt = new Date().getTime();
self.importScripts("holistic.js");
// self.importScripts("kalidokit.js");

const EWorkerState = {
  INIT: "init",
  IDLE: "idle",
  RUNNING: "running"
}

let holistic = null;
let hModelInit = false;
let workerState = EWorkerState.INIT
let result = null

async function init() {

  workerState = EWorkerState.INIT;

  hModel = new Holistic({
    locateFile: function (file) {
      // if (file.endsWith(".tflite")) {
      //   return file;
      // } else {
      //   return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
      // }}

      const path = `/holistic/${file}`;



      return path;
    }
  });
  hModel.setOptions({
    // modelComplexity: 0,
    // smoothLandmarks: true,
    // enableSegmentation: true,
    // smoothSegmentation: true,
    // refineFaceLandmarks: true,
    // minDetectionConfidence: 0.5,
    // minTrackingConfidence: 0.5,
    // cameraOn: true,
    // modelComplexity: 0,
    // smoothLandmarks: false,
    // enableSegmentation: false,
    // smoothSegmentation: false,
    // refineFaceLandmarks: true,
    // minDetectionConfidence: 0.5,
    // minTrackingConfidence: 0.55,
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    refineFaceLandmarks: true,
  });
  hModel.onResults(async function (results) {
    // const facelm = results.faceLandmarks;
    // const poselm = results.poseLandmarks;
    // const poselm3D = results.za;

    // if (facelm && poselm3D && poselm) {
    //   const pose = Kalidokit.Pose.solve(poselm3D, poselm, {
    //     runtime: 'mediapipe',
    //   });

    //   const face = Kalidokit.Face.solve(facelm, {
    //     runtime: 'mediapipe',
    //   });

    //   const result = {pose, face};

    //   postMessage(JSON.stringify(result));
    // }
    await new Promise((r) => setTimeout(r, 1))

    result = results

  
    postMessage({
      time: Date.now(),
      faceLandmarks: result.faceLandmarks,
      poseLandmarks: result.poseLandmarks,
      za: result.za
    })

    workerState = EWorkerState.IDLE

  });
  await hModel.initialize();
  console.log("holistic worker initialization!");

  workerState = EWorkerState.IDLE
}
init();

onmessage = async e => {
  if (workerState === EWorkerState.INIT) {
    console.warn("wolistic worker is still initializing!!!")
    return;
  }
  if (workerState === EWorkerState.RUNNING) {
    console.log("frame missed: running");
    return;
  }
  if (workerState === EWorkerState.IDLE) {
    workerState = EWorkerState.RUNNING
    const timestamp = performance.now()
    const now = Date.now()
    const prev = e.data.now;
    const image = e.data.bitmap;
    const delayedTime = now - prev;

    console.log("elapsed time message received from main to worker: ", delayedTime);

    // if (delayedTime > 500) {
    //   console.log("frame missed: delayed");
    //   workerState = EWorkerState.IDLE
    //   return;
    // }

    await hModel.send({ image }, timestamp);
    const timestamp2 = performance.now()
    console.log("predict time: ", timestamp2 - timestamp);
    return
  }
}