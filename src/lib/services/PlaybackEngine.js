import { eventMap } from '../stores/appStore.js';
import { VideoDecoderService } from './VideoDecoderService.js';

export class PlaybackEngine {
  videoDecoderService;
  audioContext;
  canvas;
  ctx;

  constructor(videoDecoderService, audioContext, canvas) {
    this.videoDecoderService = videoDecoderService;
    this.audioContext = audioContext;
    this.canvas = canvas;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2d context from canvas');
    }
    this.ctx = context;
  }

  start() {
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  renderLoop() {
    const currentTime = this.audioContext.currentTime;
    const segment = this.findSegment(currentTime);
    if (segment) {
      const videoAction = segment.videoAction;
      const frames = this.videoDecoderService.getFrames();
      if (frames.length > 0) {
        // This is a placeholder. A real implementation would need to calculate
        // the correct frame based on the video action (speed, reverse, etc.)
        const frame = frames[0]; 
        this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
        frame.close();
      }
    }
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  findSegment(time) {
    for (let i = 0; i < eventMap.length - 1; i++) {
      if (time >= eventMap[i].time && time < eventMap[i + 1].time) {
        return eventMap[i];
      }
    }
    return null;
  }
}
