<!-- <script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';

  export let scene;

  let earthContainer;

  onMount(() => {
    if (scene) {
      addEarthToScene();
    } else {
      console.error("Scene not provided");
    }

    return () => {
      if (earthContainer) {
        scene.remove(earthContainer);
        earthContainer = null;
      }
    };
  });

  function addEarthToScene() {
    const geometry = new THREE.SphereGeometry(1, 40, 40);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/images/earthmap1k.jpg");
    const material = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earthMesh = new THREE.Mesh(geometry, material);

    earthContainer = new THREE.Object3D();
    earthContainer.add(earthMesh);
    scene.add(earthContainer);
  }
</script>

<style>
  /* Add any specific styles for the Earth component if needed */
</style> -->
