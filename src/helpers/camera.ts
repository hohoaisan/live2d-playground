import { FpsCtrl } from './fps';

export declare interface CameraOptions {
  deviceId?: string;
  onFrame: () => Promise<void> | null;
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  frameRate?: number;
}

/**
 * Camera class will satisfy this interface. Required to keep the optimizer from
 * chopping off methods.
 */
export declare interface CameraInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/**
 * Represents a mediadevice camera. It will start a camera and then run an
 * animation loop that calls the user for each frame. If the user spends too
 * much time in the callback, then animation frames will be dropped.
 */
export class Camera implements CameraInterface {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement;
  private options: CameraOptions;
  private currentTime = 0;
  private fpsCtrl: FpsCtrl;
  private defaultOptions: Partial<CameraOptions> = {
    facingMode: 'user',
    width: 640,
    height: 480,
    frameRate: 60,
  };
  constructor(video: HTMLVideoElement, options: CameraOptions) {
    this.video = video;
    this.options = Object.assign(
      Object.assign({}, this.defaultOptions),
      options
    );
    this.fpsCtrl = new FpsCtrl(this.options.frameRate || 60, () => {
      this.task();
    });
  }

  async setStream(stream: MediaStream) {
    this.stream = stream;
    this.video.srcObject = stream;
    this.video.onloadedmetadata = () => {
      this.video.play();
      this.fpsCtrl.start();
    };
  }

  task = () => {
    if (!(this.video.paused && this.video.currentTime === this.currentTime)) {
      this.currentTime = this.video.currentTime;
      this.options?.onFrame();
    } else {
      this.fpsCtrl.pause();
    }
  };

  async start() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      alert('No navigator.mediaDevices.getUserMedia exists.');
    }
    const options = this.options;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode,
          width: options.width,
          height: options.height,
          ...(options.deviceId
            ? { deviceId: { exact: options.deviceId } }
            : {}),
        },
      });
      this.setStream(media);
    } catch (err) {
      const message = 'Failed to acquire camera feed: ' + err;
      // eslint-disable-next-line no-console
      console.error(message);
      alert(message);
    }
  }
  async stop() {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      // this.video.srcObject = null;
    }
    this.fpsCtrl.pause();
  }
}
