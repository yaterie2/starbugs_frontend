<script>
  import { link } from 'svelte-spa-router';
</script>

<nav>
  <div class="nav-container">
    <a href="/" use:link>Home</a>
    <a href="/statistics" use:link>Statistics</a>
    <a href="/pov" use:link>POV</a>
  </div>
</nav>

<style>
  nav {
    width: 100%;
    background-color: #121212;
    color: #da4747;
    padding: 1rem;
    display: flex;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .nav-container {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-right: 35px;
  }

  nav a {
    color: #da4747;
    text-decoration: none;
  }

  nav a:hover {
    text-decoration: underline;
  }
</style>
