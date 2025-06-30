<script>
  import * as Konva from 'konva';
  import { onMount } from 'svelte';
  import { lfoPoints, lfoLength, timeRange } from '../lib/stores/appStore.js';

  let container;
  let stage;
  let waveLayer;
  const { audioEngine } = $props();

  $effect(() => {
    if (audioEngine) {
      audioEngine.postMessage({
        type: 'LFO_CONFIG',
        config: {
          points: lfoPoints,
          lfoLength: lfoLength,
          timeRange: timeRange,
        },
      });
    }
  });

  $effect(() => {
    if (waveLayer) {
      waveLayer.destroyChildren();
      // Create lines
      for (let i = 0; i < lfoPoints.length - 1; i++) {
        const p1 = lfoPoints[i];
        const p2 = lfoPoints[i + 1];
        const line = new Konva.Path({
          data: `M ${p1.x * container.offsetWidth},${p1.y * 400} Q ${p1.x * container.offsetWidth + (p2.x * container.offsetWidth - p1.x * container.offsetWidth) / 2},${(p1.curve || p1.y) * 400} ${p2.x * container.offsetWidth},${p2.y * 400}`,
          stroke: 'teal',
          strokeWidth: 2,
          draggable: true,
        });
        line.on('dragmove', () => {
          const pos = stage.getPointerPosition();
          if (pos) {
            lfoPoints[i].curve = pos.y / 400;
          }
        });
        waveLayer.add(line);
      }
      // Create nodes
      lfoPoints.forEach((point, index) => {
        const node = new Konva.Circle({
          x: point.x * container.offsetWidth,
          y: point.y * 400,
          radius: 8,
          fill: 'teal',
          draggable: true,
        });
        node.on('dragmove', () => {
          lfoPoints[index] = {
            ...lfoPoints[index],
            x: node.x() / container.offsetWidth,
            y: node.y() / 400,
          };
        });
        node.on('dblclick', () => {
          lfoPoints.splice(index, 1);
        });
        waveLayer.add(node);
      });
      waveLayer.draw();
    }
  });

  onMount(() => {
    stage = new Konva.Stage({
      container,
      width: container.offsetWidth,
      height: 400,
    });

    const gridLayer = new Konva.Layer();
    waveLayer = new Konva.Layer();

    stage.add(gridLayer, waveLayer);

    stage.on('click', (e) => {
      if (e.target === stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const newPoint = {
            x: pos.x / container.offsetWidth,
            y: pos.y / 400,
            curve: pos.y / 400,
          };
          lfoPoints.push(newPoint);
          lfoPoints.sort((a, b) => a.x - b.x);
        }
      }
    });
  });
</script>

<div bind:this={container}></div>
