<script>
  import './app.css';
  import AudioTimeline from './components/AudioTimeline.svelte';
  // Video components will be added back later
</script>

<main class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Web TimeShaper</h1>
  <AudioTimeline />
  
  <!-- Placeholder for Video Editor -->
  <div class="video-editor-placeholder mt-8">
    <h2 class="text-xl font-bold mb-4">Video Editor</h2>
    <p class="text-gray-500">Video components will be added here soon.</p>
  </div>
</main>

<style>
  main {
    background-color: #18181b;
    color: #e4e4e7;
  }
</style>
