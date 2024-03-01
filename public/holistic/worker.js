let ttttt = new Date().getTime();
self.importScripts("holistic.js");
self.importScripts("kalidokit.js");

let holistic = null;
let hModelInit = false;
async function init() {
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
    // useCpuInference: false,
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
  hModel.onResults(function (results) {
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
    postMessage(JSON.stringify({
      time: new Date().getTime(),
      faceLandmarks: results.faceLandmarks,
      poseLandmarks: results.poseLandmarks,
      za: results.za
    }))

  });
  await hModel.initialize();
  console.log("holistic worker initialization!");
  hModelInit = true;
}
init();

onmessage = async e => {
  if (hModelInit && e.data) {
    // const { rgba, w, h } = e.data;
    // const timestamp = performance.now()
    // if (!rgba) return

    // if (rgba instanceof ArrayBuffer) {
    //   const t1 = new Date().getTime()
    //   const image = new ImageData(new Uint8ClampedArray(rgba), w, h)
    //   await hModel.send({ image }, timestamp);
    //   const t2 = new Date().getTime()
    //   console.log("predict: ", t2 - t1);
    // }

    const timestamp = performance.now()

    const now = Date.now()
    const prev = e.data.now;
    const image = e.data.bitmap
    console.log("delayed message sent to worker: ", now - prev);
    await hModel.send({ image }, timestamp);
    const timestamp2 = performance.now()
    console.log("predict time: ", timestamp2 - timestamp);
  }
}