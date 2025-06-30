# Web TimeShaper

This project is a web-based audio-visual tool called **Web TimeShaper**. It allows for advanced audio manipulation and synchronization of video based on audio events. The application is built with SvelteKit and utilizes a powerful stack including Konva.js for canvas interactions, the Web Audio API for real-time audio processing, WebCodecs for efficient media handling, and FFmpeg.wasm for in-browser video and audio transcoding.

The application is divided into two main workspaces:

1.  **Time Shaper**: This workspace is focused on audio manipulation. Users can load audio files, and then use an interactive LFO (Low-Frequency Oscillator) canvas to design complex modulations that affect the audio playback in real-time. This is powered by a custom `AudioWorklet` processor for high-performance audio processing.

2.  **Swappy Video Editor**: This workspace is for synchronizing video playback to audio events. It can automatically detect transients in an audio track and allows the user to map video actions (like clip selection, speed changes, and reverse playback) to these audio events. This allows for creating dynamic, audio-driven video sequences.

## Project Structure

```
/home/gordo/time-tripper/
├───.env
├───.gitignore
├───index.html
├───package.json
├───pnpm-lock.yaml
├───postcss.config.js
├───README.md
├───svelte.config.js
├───tailwind.config.js
├───vite.config.ts
├───docs/
│   ├───dev-checklist.md
│   └───uiux-instruct.md
├───public/
│   └───vite.svg
├───src/
│   ├───app.css
│   ├───App.svelte
│   ├───main.js
│   ├───components/
│   │   ├───AudioPlayer.svelte
│   │   ├───LFO_Canvas.svelte
│   │   ├───VideoPlayer.svelte
│   │   └───VideoUploader.svelte
│   ├───lib/
│   │   ├───Counter.svelte
│   │   ├───components/
│   │   │   ├───InteractiveWaveform.svelte
│   │   │   └───VideoActionEditor.svelte
│   │   ├───services/
│   │   │   ├───AudioEngine.js
│   │   │   ├───FFmpegService.js
│   │   │   ├───PlaybackEngine.js
│   │   │   └───VideoDecoderService.js
│   │   └───stores/
│   │       └───appStore.svelte.js
│   └───pages/
│       ├───SwappyEditor.svelte
│       ├───TimeShaper.svelte
│       └───Welcome.svelte
└───static/
    └───audio/
        └───time-shaper-processor.js
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).