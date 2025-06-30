import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class FFmpegService {
  ffmpeg;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load() {
    await this.ffmpeg.load();
  }

  async run(args) {
    await this.ffmpeg.exec(args);
  }

  async readFile(path) {
    const data = await this.ffmpeg.readFile(path);
    return data;
  }

  async writeFile(path, data) {
    await this.ffmpeg.writeFile(path, data);
  }
}
