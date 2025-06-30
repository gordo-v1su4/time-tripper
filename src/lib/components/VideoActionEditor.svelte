<script>
  import { eventMap } from '../stores/appStore.js';

  const { segmentIndex } = $props();

  let action = $state({
    clip: 'Clip A',
    speed: 1,
    reverse: false,
  });

  $effect(() => {
    if (eventMap[segmentIndex]) {
      eventMap[segmentIndex].videoAction = action;
    }
  });
</script>

<div>
  <select bind:value={action.clip}>
    <option>Clip A</option>
    <option>Clip B</option>
  </select>
  <input type="range" min="-2" max="2" step="0.1" bind:value={action.speed} />
  <label>
    <input type="checkbox" bind:checked={action.reverse} />
    Reverse
  </label>
</div>
