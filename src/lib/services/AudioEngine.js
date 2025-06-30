export class AudioEngine {
  audioContext = null;
  workletNode = null;
  sourceNode = null;
  audioBuffer = null;

  async loadAudio(file) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      await this.audioContext.audioWorklet.addModule('/audio/time-shaper-processor.js');
      this.workletNode = new AudioWorkletNode(this.audioContext, 'time-shaper-processor');
      this.workletNode.connect(this.audioContext.destination);
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play() {
    if (this.audioBuffer) {
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.connect(this.workletNode);
      this.sourceNode.start();
    }
  }

  pause() {
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
  }

  postMessage(message) {
    if (this.workletNode) {
      this.workletNode.port.postMessage(message);
    }
  }

  onMessage(callback) {
    if (this.workletNode) {
      this.workletNode.port.onmessage = (event) => {
        callback(event.data);
      };
    }
  }
}
