<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from '@three/controls/OrbitControls.js';

  export let currentDate;

  let canvas;
  let renderer;
  let camera;
  let scene;
  let earthMesh;

  const ephemerisData = [
    { date: '2023-06-21', a: 149707132.6983405, e: 0.01596509390043108, i: 0.002865571752163338, omega: 172.3363714587514, w: 290.8517886555517, M: 165.4449492577906 },
    // Add more ephemeris data if available
  ];

  const AU = 149597870.7;

  function calculatePosition(date) {
    const data = ephemerisData.find(d => d.date === date);
    if (!data) {
      console.warn('Ephemeris data not found for date:', date);
      return { x: 0, y: 0, z: 0 };
    }

    const { a, e, i, omega, w, M } = data;

    // Simplified position calculation, might need adjustment for real orbital mechanics
    const x = a * (Math.cos(M) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(M);
    const z = 0;

    return { x, y, z };
  }

  onMount(() => {
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);

    const controls = new OrbitControls(camera, renderer.domElement);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // Call updatePosition after the mesh is created
    if (earthMesh) {
      updatePosition(currentDate);
    }
  });

  function updatePosition(date) {
    if (!earthMesh) {
      console.warn('Earth mesh is not initialized');
      return;
    }

    const position = calculatePosition(date);
    if (position) {
      earthMesh.position.set(position.x / AU, position.y / AU, position.z / AU);
    } else {
      console.warn('Position data is invalid for date:', date);
    }
  }

  $: {
    if (earthMesh) {
      updatePosition(currentDate);
    }
  }
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: block;
  }
</style>
