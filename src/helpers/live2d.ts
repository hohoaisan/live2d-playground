'use client';

import { type Application } from 'pixi.js';
import {
  type Cubism4InternalModel,
  type Live2DModel,
  ModelSettings,
} from 'pixi-live2d-display';

import { EParam } from '@/constants/enum';

const SCALE = 1;

const width = window.innerWidth;
const height = window.innerHeight;

export class ModelManagement {
  app: Application | null;
  live2dModel: Live2DModel | null;
  modelUrl: string;
  scale: number = SCALE;
  isFlip = false;

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
}

const model = new ModelManagement();

export default model;
