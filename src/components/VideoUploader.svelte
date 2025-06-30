<script>
  import { FFmpegService } from '../lib/services/FFmpegService';
  import { AudioEngine } from '../lib/services/AudioEngine';

  export let onVideoLoaded;

  let files;
  let ffmpegService = new FFmpegService();
  let audioEngine = new AudioEngine();

  async function loadVideo() {
    if (files && files.length > 0) {
      const file = files[0];
      
      // Extract audio using ffmpeg
      await ffmpegService.load();
      const arrayBuffer = await file.arrayBuffer();
      await ffmpegService.writeFile('input.mp4', new Uint8Array(arrayBuffer));
      await ffmpegService.run(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', 'audio.wav']);
      const audioData = await ffmpegService.readFile('audio.wav');
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(new Uint8Array(audioData).buffer);
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      await audioEngine.initialize(sourceNode);

      onVideoLoaded({
        audioBuffer,
        audioEngine,
        videoFile: file,
        audioContext
      });
      sourceNode.start();
    }
  }
</script>

<input type="file" bind:files on:change={loadVideo} accept="video/*" />
