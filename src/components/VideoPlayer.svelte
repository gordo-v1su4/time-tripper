<script>
  import { onMount } from 'svelte';
  import { PlaybackEngine } from '../lib/services/PlaybackEngine';

  const { videoDecoderService, audioContext } = $props();
  let canvas;

  onMount(() => {
    const playbackEngine = new PlaybackEngine(videoDecoderService, audioContext, canvas);
    playbackEngine.start();
  });
</script>

<canvas bind:this={canvas} width="640" height="480"></canvas>
