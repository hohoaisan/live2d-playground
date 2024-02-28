'use client';

import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors } from '@mediapipe/drawing_utils';
import {
  FACEMESH_TESSELATION,
  Holistic,
  POSE_CONNECTIONS,
  Results,
} from '@mediapipe/holistic';
import { TFace, TPose } from 'kalidokit';
import { Face, Pose, TFVectorPose, Vector } from 'kalidokit';
import { type Application } from 'pixi.js';
import {
  type Cubism4InternalModel,
  type Live2DModel,
  ModelSettings,
} from 'pixi-live2d-display';

const { lerp } = Vector;

import { EParam } from '@/constants/enum';

const SCALE = 1;

const width = window.innerWidth;
const height = window.innerHeight;

const videoElement = document.createElement('video');

const guideCanvas = document.createElement('canvas');
let camera: Camera | null = null;
let holistic: Holistic | null = null;

export class ModelManagement {
  app: Application | null;
  live2dModel: Live2DModel | null;
  modelUrl: string;
  scale: number = SCALE;
  isFlip = false;
  isTracking = false;

  constructor() {
    this.modelUrl = '';
    this.scale;
    this.app = null;
    this.live2dModel = null;
  }

  changeScale = (w: number) => {
    if (!this.live2dModel) return;
    const scale = (height / this.live2dModel.internalModel.originalHeight) * w;
    this.live2dModel.scale.set(-scale, scale);
  };

  getMotions = () => {
    const motionGroups =
      this.live2dModel?.internalModel.motionManager.motionGroups || {};

    return Object.keys(motionGroups);
  };

  playMotion = (motion: string, index?: number) => {
    this.live2dModel?.motion(motion, index);
  };

  getExpressions = () => {
    const expressions =
      (
        this.live2dModel?.internalModel.settings as ModelSettings & {
          expressions?: { Name: string; File: string }[];
        }
      )?.expressions || [];

    return expressions.map((e) => e.Name);
  };

  changeExpression = (expression: string) => {
    this.live2dModel?.expression(expression);
  };

  loadModel = async (model: string | Array<File> | FileList) => {
    try {
      // load live2d model
      const pixiLive2D = await import('pixi-live2d-display');
      const PIXI = await import('pixi.js');
      await import('./zip');

      pixiLive2D.Live2DModel.registerTicker(PIXI.Ticker);
      const live2dModel = await pixiLive2D.Live2DModel.from(model, {
        autoInteract: true,
        idleMotionGroup: 'disable_idle_motion',
      });

      const scale =
        (height / live2dModel.internalModel.originalHeight) * this.scale ||
        SCALE;
      live2dModel.scale.set(-scale, scale);
      live2dModel.anchor.set(0.5, 0);
      live2dModel.position.set(width * 0.5, 0);
      // Remove current model in stage
      this.app?.stage.removeChildren();
      // add live2d model to stage
      this.app?.stage.addChild(live2dModel);
      this.live2dModel = live2dModel;
      this.draggable(live2dModel);
      (live2dModel.internalModel as Cubism4InternalModel).eyeBlink = undefined;
      await this.switchTracking();
    } catch (error) {
      alert('🚀 Can not load model from server: ' + JSON.stringify(error));
    }
  };

  flipView = (isFlip = this.isFlip) => {
    if (!this.app) return;
    this.isFlip = isFlip;
    if (isFlip) {
      this.app.stage.scale.x = -1;
      this.app.stage.x = width;
    } else {
      this.app.stage.scale.x = 1;
      this.app.stage.x = 0;
    }
  };

  initialize = async (viewCanvas: HTMLCanvasElement) => {
    const PIXI = await import('pixi.js');
    this.app = new PIXI.Application({
      view: viewCanvas,
      autoStart: true,
      transparent: true,
      backgroundAlpha: 0,
      // width: width,
      // height: height,
      resizeTo: window,
    });

    await this.loadModel(this.modelUrl);
  };

  setParameter(name: EParam, value: number) {
    const coreModel = this.live2dModel?.internalModel
      .coreModel as Cubism4InternalModel['coreModel'];
    if (!coreModel) return;
    coreModel.setParameterValueById(name, value);
  }

  dragging = false;
  _pointerX = 0;
  _pointerY = 0;

  draggable = (model: Live2DModel) => {
    model.buttonMode = true;
    model.on('pointerdown', (e) => {
      this.dragging = true;
      this._pointerX = e.data.global.x - model.x;
      this._pointerY = e.data.global.y - model.y;
    });
    model.on('pointermove', (e) => {
      if (this.dragging) {
        model.position.x = e.data.global.x - this._pointerX;
        model.position.y = e.data.global.y - this._pointerY;
      }
    });
    model.on('pointerupoutside', () => (this.dragging = false));
    model.on('pointerup', () => (this.dragging = false));
  };

  async extractRenderBlob(_canvas: HTMLCanvasElement) {
    const image = await this.app?.renderer.plugins.extract.base64(
      this.app?.stage
    );

    const response = await fetch(image);
    const blob = await response.blob();

    return blob;

    // const sourceCanvas = canvas;
    // if (!sourceCanvas) return;
    // const extractCanvas = document.createElement('canvas');
    // const extractContext = extractCanvas.getContext('2d');
    // extractCanvas.width = window.innerWidth;
    // extractCanvas.height = window.innerHeight;
    // extractContext?.drawImage(sourceCanvas, 0, 0);
    // return await new Promise<Blob | null>((r) => extractCanvas.toBlob(r));
  }

  private drawResults = (results: Results) => {
    if (!guideCanvas || !videoElement || !results) return;
    if (guideCanvas && videoElement) {
      guideCanvas.width = videoElement.videoWidth;
      guideCanvas.height = videoElement.videoHeight;
    }
    const canvasCtx = guideCanvas.getContext('2d');
    canvasCtx?.save();
    canvasCtx?.clearRect(
      0,
      0,
      guideCanvas.width as number,
      guideCanvas.height as number
    );

    drawConnectors(
      canvasCtx as CanvasRenderingContext2D,
      results.poseLandmarks,
      POSE_CONNECTIONS,
      {
        color: '#00FF00',
        lineWidth: 4,
      }
    );
    drawConnectors(
      canvasCtx as CanvasRenderingContext2D,
      results.faceLandmarks,
      FACEMESH_TESSELATION,
      {
        color: '#C0C0C070',
        lineWidth: 1,
      }
    );
  };

  private rigFaceAndPose = (
    resultRigFace: TFace,
    resultRigPose: TPose,
    lerpAmount = 0.7
  ) => {
    if (!this.live2dModel || !resultRigFace || !resultRigPose) return;
    const coreModel = (this.live2dModel.internalModel as Cubism4InternalModel)
      .coreModel;

    // --- set hand params ---
    coreModel.setParameterValueById(
      'HandRightPositionY',
      lerp(
        Math.abs(resultRigPose.RightLowerArm.y),
        coreModel.getParameterValueById('HandRightPositionY'),
        0.4
      )
    );
    coreModel.setParameterValueById(
      'HandLeftPositionY',
      lerp(
        Math.abs(resultRigPose.LeftLowerArm.y),
        coreModel.getParameterValueById('HandLeftPositionY'),
        0.4
      )
    );
    // --- set hand params ---

    coreModel.setParameterValueById(
      'ParamEyeBallX',
      lerp(
        resultRigFace.pupil.x,
        coreModel.getParameterValueById('ParamEyeBallX'),
        lerpAmount
      )
    );
    coreModel.setParameterValueById(
      'ParamEyeBallY',
      lerp(
        resultRigFace.pupil.y,
        coreModel.getParameterValueById('ParamEyeBallY'),
        lerpAmount
      )
    );

    // X and Y axis rotations are swapped for Live2D parameters
    // because it is a 2D system and KalidoKit is a 3D system
    coreModel.setParameterValueById(
      'ParamAngleX',
      lerp(
        resultRigFace.head.degrees.y,
        coreModel.getParameterValueById('ParamAngleX'),
        lerpAmount
      )
    );
    coreModel.setParameterValueById(
      'ParamAngleY',
      lerp(
        resultRigFace.head.degrees.x,
        coreModel.getParameterValueById('ParamAngleY'),
        lerpAmount
      )
    );
    coreModel.setParameterValueById(
      'ParamAngleZ',
      lerp(
        resultRigFace.head.degrees.z,
        coreModel.getParameterValueById('ParamAngleZ'),
        lerpAmount
      )
    );

    // update body params for models without head/body param sync
    const dampener = 0.3;
    coreModel.setParameterValueById(
      'ParamBodyAngleX',
      lerp(
        resultRigFace.head.degrees.y * dampener,
        coreModel.getParameterValueById('ParamBodyAngleX'),
        lerpAmount
      )
    );
    coreModel.setParameterValueById(
      'ParamBodyAngleY',
      lerp(
        resultRigFace.head.degrees.x * dampener,
        coreModel.getParameterValueById('ParamBodyAngleY'),
        lerpAmount
      )
    );
    coreModel.setParameterValueById(
      'ParamBodyAngleZ',
      lerp(
        resultRigFace.head.degrees.z * dampener,
        coreModel.getParameterValueById('ParamBodyAngleZ'),
        lerpAmount
      )
    );
    // eye blink
    coreModel.setParameterValueById(
      'ParamEyeLOpen',
      lerp(
        resultRigFace.eye.l,
        coreModel.getParameterValueById('ParamEyeLOpen'),
        0.3
      )
    );
    coreModel.setParameterValueById(
      'ParamEyeROpen',
      lerp(
        resultRigFace.eye.r,
        coreModel.getParameterValueById('ParamEyeROpen'),
        0.3
      )
    );

    const stabilizedBrow = Face.stabilizeBlink(
      {
        l: lerp(
          resultRigFace.eye.l,
          coreModel.getParameterValueById('ParamBrowLY'),
          0.7
        ),
        r: lerp(
          resultRigFace.eye.r,
          coreModel.getParameterValueById('ParamBrowRY'),
          0.7
        ),
      },
      resultRigFace.head.y
    );

    coreModel.setParameterValueById('ParamBrowLY', stabilizedBrow.l);
    coreModel.setParameterValueById('ParamBrowRY', stabilizedBrow.r);

    // mouth
    coreModel.setParameterValueById(
      'ParamMouthOpenY',
      lerp(
        resultRigFace.mouth.y,
        coreModel.getParameterValueById('ParamMouthOpenY'),
        0.3
      )
    );
    // Adding 0.3 to ParamMouthForm to make default more of a "smile"
    coreModel.setParameterValueById(
      'ParamMouthForm',
      0.2 +
        lerp(
          resultRigFace.mouth.x,
          coreModel.getParameterValueById('ParamMouthForm'),
          0.6
        )
    );

    // ループする虹アニメーションを追加する
    const currentParam = coreModel.getParameterValueById('Loop0001') || 0;
    const newParam = currentParam <= 1.975 ? currentParam + 0.025 : 0;
    coreModel.setParameterValueById(
      'Loop0001',
      lerp(newParam, newParam !== 0 ? currentParam : -0.001, lerpAmount)
    );
  };

  private animateLive2DModel = (results: Results) => {
    if (!this.live2dModel) return;
    const facelm = results.faceLandmarks;
    const poselm = results.poseLandmarks;
    const poselm3D = (results as unknown as { za: TFVectorPose }).za;

    if (facelm && poselm3D && poselm) {
      const poseRig = Pose.solve(poselm3D, poselm, {
        runtime: 'mediapipe',
        video: videoElement,
      });

      const riggedFace = Face.solve(facelm, {
        runtime: 'mediapipe',
        video: videoElement,
      });

      poseRig && riggedFace && this.rigFaceAndPose(riggedFace, poseRig, 0.5);
    }
  };

  private onResults = (results: Results) => {
    this.drawResults(results);
    this.animateLive2DModel(results);
  };

  public switchTracking = async () => {
    try {
      if (!this.isTracking) {
        camera?.stop();
        return;
      }

      if (!holistic) {
        holistic = new Holistic({
          locateFile: function (file) {
            return `/holistic/${file}`;
          },
        });
        holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          smoothSegmentation: true,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        holistic.initialize();

        holistic.onResults(this.onResults);
      }

      if (videoElement && !camera) {
        camera = new Camera(videoElement, {
          onFrame: async () => {
            holistic?.send({ image: videoElement });
          },
          width: 1280,
          height: 720,
        });
      }
      camera?.start();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };
}

const model = new ModelManagement();

export default model;
