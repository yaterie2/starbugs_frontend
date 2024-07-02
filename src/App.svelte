<script>
  import Router from 'svelte-spa-router';
  import { link } from 'svelte-spa-router';
  import Home from './Home.svelte';
  import Statistics from './Stats.svelte';
  import NavBar from './NavBar.svelte';
  import POV from './POV.svelte';

  const routes = {
    '/': Home,
    '/statistics': Statistics,
    '/pov': POV,
  };
</script>

<NavBar />

<main>
  <Router {routes} />
</main>

<style>
  main {
    padding-top: 0rem; /* Adjust based on the height of your navbar */
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
