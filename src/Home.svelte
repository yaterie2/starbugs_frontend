<script>
  // Your Home.svelte script content
</script>

<div class="content">
  <h1>Home</h1>
  <p>Welcome to GALAX</p>
  <div class="additional-content">
    <!-- Additional content -->
  </div>
</div>

<div class="home-background"></div>

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
  }

  .content {
    position: relative;
    z-index: 1; /* Ensure content is above the background */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100vh;
    color: #da4747;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
  }

  .home-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('../images/home.jpg') no-repeat center center;
    background-size: cover;
    z-index: 0; /* Ensure the background stays behind other content */
  }
  
  .home-background::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6); /* Black overlay with 50% opacity */
    z-index: -1; /* Place the overlay behind the background image */
  }

  .additional-content {
    margin-top: 20px;
    /* Additional styles for other content */
  }
</style>
