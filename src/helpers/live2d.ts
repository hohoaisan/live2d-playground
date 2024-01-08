'use client';

import { type Application } from 'pixi.js';
import { type Live2DModel, ModelSettings } from 'pixi-live2d-display';

const SCALE = 2;

const width = 1280;
const height = 720;

class ModelManagement {
  app: Application | null;
  live2dModel: Live2DModel | null;
  modelUrl: string;
  scale: number = SCALE;

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
        // idleMotionGroup: 'disable_idle_motion',
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
    } catch (error) {
      alert('🚀 Can not load model from server: ' + JSON.stringify(error));
    }
  };

  initialize = async (canvas: HTMLCanvasElement) => {
    const PIXI = await import('pixi.js');
    this.app = new PIXI.Application({
      view: canvas,
      autoStart: true,
      transparent: true,
      backgroundAlpha: 0,
      width: width,
      height: height,
    });

    await this.loadModel(this.modelUrl);
  };
}

const model = new ModelManagement();

export default model;
