<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
  import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

  const dispatch = createEventDispatcher();

  let {
    audioUrl = null,
    height = 128,
    waveColor = 'rgba(13, 148, 136, 0.5)', // teal-600
    progressColor = 'rgba(204, 255, 0, 0.9)', // lime-300 from cursor
    cursorColor = '#ccff00',
    cursorWidth = 2,
  } = $props();

  let wavesurfer = $state();
  let regionsPlugin = $state();
  let container = $state();
  let timelineContainer = $state();
  let isPlaying = $state(false);
  let duration = $state(0);
  let currentTime = $state(0);
  let isLoaded = $state(false);
  let isAnalyzing = $state(false);
  let transientMarkers = $state([]);
  let files;
  let zoom = $state(1);

  // Transient detection variables
  let isDetectingTransients = $state(false);
  let transientDensity = $state(30);
  let transientRandomness = $state(50);
  let transientSensitivity = $state(60);
  let transientMinSpacing = $state(0.8);

  onMount(() => {
    if (!container) return;

    wavesurfer = WaveSurfer.create({
      container,
      height,
      waveColor,
      progressColor,
      cursorColor,
      cursorWidth,
      normalize: true,
      backend: 'WebAudio',
      plugins: [
        regionsPlugin = RegionsPlugin.create({
          dragSelection: true,
          slop: 5,
        }),
        TimelinePlugin.create({
          container: timelineContainer,
        })
      ]
    });

    wavesurfer.on('ready', () => {
      duration = wavesurfer.getDuration();
      isLoaded = true;
      dispatch('audiostate', { isPlaying, currentTime, duration });
    });

    wavesurfer.on('audioprocess', () => {
      currentTime = wavesurfer.getCurrentTime();
      dispatch('audiostate', { isPlaying, currentTime, duration });
    });

    wavesurfer.on('play', () => isPlaying = true);
    wavesurfer.on('pause', () => isPlaying = false);

    if (audioUrl) {
      loadAudio(audioUrl);
    }
  });

  onDestroy(() => {
    if (wavesurfer) {
      wavesurfer.destroy();
    }
  });

  async function loadAudioFromUpload() {
    if (files && files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      loadAudio(url);
    }
  }

  function loadAudio(url) {
    if (!wavesurfer) return;
    isLoaded = false;
    clearTransientMarkers();
    wavesurfer.load(url);
  }

  function togglePlay() {
    if (!wavesurfer) return;
    wavesurfer.playPause();
  }
  
  function setZoom(value) {
    if (!wavesurfer) return;
    wavesurfer.zoom(value);
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function analyzeAudio() {
    if (!wavesurfer || !isLoaded || isAnalyzing) return;
    isAnalyzing = true;

    const duration = wavesurfer.getDuration();
    const sectionColors = [
      'rgba(13, 148, 136, 0.5)',  // teal-600
      'rgba(20, 83, 45, 0.5)',     // green-900
      'rgba(252, 165, 165, 0.5)', // red-300
      'rgba(253, 224, 71, 0.5)',  // yellow-300
      'rgba(129, 140, 248, 0.5)'  // indigo-400
    ];
    const structure = [
      { name: 'Intro', start: 0, end: duration * 0.1, color: sectionColors[0] },
      { name: 'Verse', start: duration * 0.1, end: duration * 0.4, color: sectionColors[1] },
      { name: 'Chorus', start: duration * 0.4, end: duration * 0.6, color: sectionColors[2] },
      { name: 'Verse 2', start: duration * 0.6, end: duration * 0.8, color: sectionColors[3] },
      { name: 'Outro', start: duration * 0.8, end: duration, color: sectionColors[4] }
    ];

    regionsPlugin.clearRegions();
    structure.forEach(sec => {
      regionsPlugin.addRegion({
        start: sec.start,
        end: sec.end,
        color: sec.color,
        content: sec.name,
        drag: false,
        resize: false
      });
    });

    isAnalyzing = false;
  }

  async function detectTransients() {
    if (!wavesurfer || !isLoaded || isDetectingTransients) return;
    isDetectingTransients = true;
    clearTransientMarkers();

    const audioBuffer = wavesurfer.getDecodedData();
    if (!audioBuffer) {
      isDetectingTransients = false;
      return;
    }

    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const transients = [];
    
    const skipFactor = Math.max(1, Math.round((101 - transientDensity) * 0.2));
    const randomThreshold = transientRandomness / 100;
    const sensitivity = 1 - (transientSensitivity / 100);
    const minSpacingSamples = Math.floor(transientMinSpacing * sampleRate);

    let prevAvg = 0;
    let windowSize = Math.floor(sampleRate * 0.01);
    let lastTransientSample = -minSpacingSamples;

    for (let i = 0; i < rawData.length; i += windowSize * skipFactor) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        if (i + j < rawData.length) {
          sum += rawData[i + j] * rawData[i + j];
        }
      }
      const rms = Math.sqrt(sum / windowSize);

      if (rms > prevAvg * (1 + sensitivity) && rms > 0.01) {
        if (i - lastTransientSample >= minSpacingSamples) {
          if (Math.random() > randomThreshold) {
            const time = i / sampleRate;
            if (time > 0 && time < duration) {
              transients.push(time);
              lastTransientSample = i;
            }
          }
        }
      }
      prevAvg = (prevAvg + rms) / 2;
    }

    transients.forEach(time => createTransientMarker(time));
    isDetectingTransients = false;
  }

  function createTransientMarker(time) {
    const marker = regionsPlugin.addRegion({
      start: time,
      end: time + 0.02,
      color: 'hsla(60, 80%, 50%, 0.7)',
      drag: false,
      resize: false,
      data: { type: 'transient' }
    });
    transientMarkers = [...transientMarkers, marker];
  }

  function clearTransientMarkers() {
    transientMarkers.forEach(marker => marker.remove());
    transientMarkers = [];
  }
</script>
<div class="audio-timeline">
  <div class="controls p-2 bg-zinc-900 rounded-t-lg flex items-center gap-4 border-b border-zinc-800">
    <label for="audio-upload" class="button">Load Audio</label>
    <input type="file" bind:files on:change={loadAudioFromUpload} accept="audio/*" class="hidden" id="audio-upload" />
    
    <button on:click={togglePlay} disabled={!isLoaded} class="button-icon">
      {#if isPlaying}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      {/if}
    </button>

    <div class="time-info font-mono text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-md">{formatTime(currentTime)} / {formatTime(duration)}</div>

    <div class="flex items-center gap-2 w-40">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-500"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line></svg>
        <input id="zoom-slider" type="range" class="slider" min="1" max="500" bind:value={zoom} on:input={() => setZoom(zoom)} />
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-500"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line><line x1="11" y1="8" x2="11" y2="14"></line></svg>
    </div>

    <div class="flex-grow"></div>

    <button on:click={analyzeAudio} disabled={!isLoaded || isAnalyzing} class="button">Analyze Structure</button>
  </div>

  <div class="analysis-controls p-3 bg-zinc-800/70 border-b border-zinc-800">
    <div class="grid grid-cols-5 gap-4">
        <button on:click={detectTransients} disabled={!isLoaded || isDetectingTransients} class="button col-span-1">
          {#if isDetectingTransients}Working...{:else}Detect Transients{/if}
        </button>
      <div class="slider-group">
        <label for="density-slider" class="slider-label">Density <span class="slider-value">{transientDensity}%</span></label>
        <input id="density-slider" type="range" class="slider" min="1" max="100" bind:value={transientDensity} />
      </div>
      <div class="slider-group">
        <label for="randomness-slider" class="slider-label">Randomness <span class="slider-value">{transientRandomness}%</span></label>
        <input id="randomness-slider" type="range" class="slider" min="0" max="100" bind:value={transientRandomness} />
      </div>
      <div class="slider-group">
        <label for="sensitivity-slider" class="slider-label">Sensitivity <span class="slider-value">{transientSensitivity}%</span></label>
        <input id="sensitivity-slider" type="range" class="slider" min="1" max="100" bind:value={transientSensitivity} />
      </div>
      <div class="slider-group">
        <label for="spacing-slider" class="slider-label">Min Spacing <span class="slider-value">{transientMinSpacing.toFixed(2)}s</span></label>
        <input id="spacing-slider" type="range" class="slider" min="0" max="2" step="0.05" bind:value={transientMinSpacing} />
      </div>
    </div>
  </div>

  <div class="waveform-container" bind:this={container}></div>
  <div class="timeline-container" bind:this={timelineContainer}></div>
</div>

<style>
  .audio-timeline {
    background-color: #18181b; /* zinc-900 */
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #3f3f46; /* zinc-700 */
  }
  .waveform-container {
    background-color: #27272a; /* zinc-800 */
  }
  .timeline-container {
    background-color: #27272a; /* zinc-800 */
  }
  .button, .button-icon {
    background-color: #3f3f46; /* zinc-700 */
    border: 1px solid #52525b; /* zinc-600 */
    color: #d4d4d8; /* zinc-300 */
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-weight: 500;
    font-size: 0.75rem;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px; /* Half height */
  }
  .button-icon {
    padding: 0.25rem;
  }
  .button:hover, .button-icon:hover {
    background-color: #52525b; /* zinc-600 */
    border-color: #71717a; /* zinc-500 */
    color: #fafafa; /* zinc-50 */
  }
  .button:active, .button-icon:active {
    background-color: #27272a; /* zinc-800 */
  }
  .button:disabled, .button-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .slider-label {
    font-size: 0.65rem;
    color: #a1a1aa; /* zinc-400 */
    padding-left: 2px;
  }
  .slider-value {
    font-size: 0.6rem;
    color: #71717a; /* zinc-500 */
  }
  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #52525b; /* zinc-600 */
    outline: none;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 6px; /* thinner */
    height: 14px; /* rectangular */
    border-radius: 1px;
    background: #14b8a6; /* teal-500 */
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .slider::-webkit-slider-thumb:hover {
    background: #ccff00;
  }
  .slider::-moz-range-thumb {
    width: 6px;
    height: 14px;
    border-radius: 1px;
    background: #14b8a6;
    cursor: pointer;
    border: none;
  }
  .slider::-moz-range-thumb:hover {
    background: #ccff00;
  }
</style>
