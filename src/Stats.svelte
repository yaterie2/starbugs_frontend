<script>
  import Filters from "./Filters.svelte";
  import Results from "./Results.svelte";
</script>

<div class="stats-background"></div>

<main>
  <h1>Statistics</h1>
  <Filters />
  <Results />
</main>

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .stats-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, #020e25 0%, #000000 100%);
    z-index: -1; /* Ensure the background is behind the main content */
  }

  main {
    position: relative;
    z-index: 1; /* Ensure the main content is above the background */
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #b8a7a7;
    height: 100vh;
  }
</style>
