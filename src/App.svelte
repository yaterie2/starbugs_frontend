<script>
  import Filters from "./components/Filters.svelte";
  import Results from "./components/Results.svelte";
  import Navbar from "./components/Navbar.svelte";
</script>

<main>
  <Navbar />
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
