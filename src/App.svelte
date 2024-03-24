<script>
  import Filters from "./components/Filters.svelte";
  import Results from "./components/Results.svelte";
</script>

<main>
  <Filters />
  <Results />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
