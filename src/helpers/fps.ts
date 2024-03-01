export class FpsCtrl {
  fps: number;
  delay: number;
  time?: number;
  frame = -1;
  tref!: number;
  isPlaying = false;
  callback: (props: { time: number; frame: number }) => void;
  constructor(fps: number, callback: (props: { time: number; frame: number }) => void) {
    this.fps = fps;
    this.delay = 1000 / fps;
    this.callback = callback;
  }

  loop = (timestamp: number) => {
    if (!this.time) this.time = timestamp;
    const seg = Math.floor((timestamp - this.time) / this.delay);
    if (seg > this.frame) {
      this.frame = seg;
      this.callback({
        time: timestamp,
        frame: this.frame,
      });
    }
    this.tref = requestAnimationFrame(this.loop);
  };

  start = () => {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.tref = requestAnimationFrame(this.loop);
    }
  };

  pause = () => {
    if (this.isPlaying) {
      cancelAnimationFrame(this.tref);
      this.isPlaying = false;
      this.time = undefined;
      this.frame = -1;
    }
  };

  frameRate = (newfps?: number) => {
    if (!newfps) return this.fps;
    this.fps = newfps;
    this.delay = 1000 / this.fps;
    this.frame = -1;
    this.time = undefined;
  };
}
