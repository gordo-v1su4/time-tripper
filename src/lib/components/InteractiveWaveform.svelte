<script>
  import { onMount } from 'svelte';
  import { eventMap } from '../stores/appStore.js';

  const { audioBuffer, audioEngine } = $props();
  let canvas;

  function draw() {
    if (!audioBuffer || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'teal';
    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    // Draw event markers
    ctx.strokeStyle = 'red';
    for (const marker of eventMap) {
      const x = (marker.time / audioBuffer.duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / canvas.width) * audioBuffer.duration;
    
    // Check if clicking on existing marker to remove
    const existingMarkerIndex = eventMap.findIndex(marker => Math.abs(marker.time - time) < 0.1);
    if (existingMarkerIndex > -1) {
      eventMap.splice(existingMarkerIndex, 1);
    } else {
      eventMap.push({ time, videoAction: {} });
      eventMap.sort((a, b) => a.time - b.time);
    }
  }

  onMount(() => {
    draw();
    if (audioEngine) {
      audioEngine.onMessage((message) => {
        if (message.type === 'TRANSIENT_DETECTED') {
          eventMap.push({ time: message.timestamp, videoAction: {} });
          eventMap.sort((a, b) => a.time - b.time);
        }
      });
    }
  });

  $effect(() => {
    draw();
  });
</script>

<canvas bind:this={canvas} onclick={handleClick} width="800" height="200"></canvas>
