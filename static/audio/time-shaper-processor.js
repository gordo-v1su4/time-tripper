class CircularBuffer {
  constructor(size, channels = 2) {
    this.size = size;
    this.channels = channels;
    this.buffer = Array.from({ length: channels }, () => new Float32Array(size));
    this.writeIndex = 0;
  }

  write(channels) {
    for (let i = 0; i < this.channels; i++) {
      this.buffer[i][this.writeIndex] = channels[i] || 0;
    }
    this.writeIndex = (this.writeIndex + 1) % this.size;
  }

  read(delayInSamples) {
    const readIndex = (this.writeIndex - 1 - delayInSamples + this.size) % this.size;
    const nextIndex = (readIndex + 1) % this.size;
    const fraction = readIndex - Math.floor(readIndex);

    const output = [];
    for (let i = 0; i < this.channels; i++) {
      const prev = this.buffer[i][Math.floor(readIndex)];
      const next = this.buffer[i][Math.floor(nextIndex)];
      output[i] = prev + (next - prev) * fraction;
    }
    return output;
  }
}

class TimeShaperProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastAmplitude = 0;
    this.transientThreshold = 0.5;
    this.lfoConfig = null;
    this.lfoPhase = 0;
    this.buffer = new CircularBuffer(sampleRate * 5); // 5 seconds buffer

    this.port.onmessage = (event) => {
      if (event.data.type === 'LFO_CONFIG') {
        this.lfoConfig = event.data.config;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let i = 0; i < input[0].length; i++) {
      const inputChannels = [];
      for (let j = 0; j < input.length; j++) {
        inputChannels.push(input[j][i]);
      }
      this.buffer.write(inputChannels);

      if (this.lfoConfig) {
        const lfoValue = this.getLfoValue();
        const delayInSamples = lfoValue * this.lfoConfig.timeRange * sampleRate;
        const delayedSample = this.buffer.read(delayInSamples);
        for (let j = 0; j < output.length; j++) {
          output[j][i] = delayedSample[j];
        }
        this.lfoPhase += 1 / (this.lfoConfig.lfoLength * sampleRate);
        if (this.lfoPhase >= 1) {
          this.lfoPhase -= 1;
        }
      } else {
        for (let j = 0; j < output.length; j++) {
          output[j][i] = input[j][i];
        }
      }

      const currentAmplitude = Math.abs(input[0][i]);
      if (currentAmplitude > this.lastAmplitude + this.transientThreshold) {
        this.port.postMessage({ type: 'TRANSIENT_DETECTED', timestamp: currentTime + i / sampleRate });
      }
      this.lastAmplitude = currentAmplitude;
    }

    return true;
  }

  getLfoValue() {
    if (!this.lfoConfig || this.lfoConfig.points.length === 0) {
      return 0;
    }

    const points = this.lfoConfig.points;
    const phase = this.lfoPhase;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (phase >= p1.x && phase <= p2.x) {
        const t = (phase - p1.x) / (p2.x - p1.x);
        const cp = p1.curve || p1.y;
        return (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cp + t * t * p2.y;
      }
    }
    return points[points.length - 1].y;
  }
}

registerProcessor("time-shaper-processor", TimeShaperProcessor);
