<script>
  import { onMount, onDestroy } from "svelte";
  import axios from "axios";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();

  let camera, scene, renderer, controls;
  let earthContainer;
  const SUN_POSITION = { x: 0.000005, y: 0, z: 0 };

  const maxMag = 8;
  const minRadius = 0.17;
  const maxRadius = 1587.37;
  const minNewRadius = 0.07; // Minimum size for stars
  const maxNewRadius = 2; // Maximum size for stars
  let sunIgnored = false;

  let lineGroup = new THREE.Group();
  let starGroup = new THREE.Group();
  let hitboxGroup = new THREE.Group(); // Group for hitboxes
  let clear = false;

  const SUN_RADIUS = 1; // Using 1 unit as the Sun's radius for scaling

  const EARTH_RADIUS_KM = 6371;
  const SUN_RADIUS_KM = 696340;
  const EARTH_SUN_DISTANCE_KM = 149600000;

  const EARTH_RADIUS = (EARTH_RADIUS_KM / SUN_RADIUS_KM) * SUN_RADIUS;
  const EARTH_SUN_DISTANCE = (EARTH_SUN_DISTANCE_KM / SUN_RADIUS_KM) * SUN_RADIUS;

  onMount(() => {
    init();
    loadAllStars(); // Load all stars within the magnitude range
    renderer.domElement.addEventListener("click", onMouseClick);
  });

  function init() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    camera.position.set(21, 0, 0.1); // Initial camera position

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Set a background color

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // Ensure this is executed

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable smooth transitions
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.01; // Minimum distance for zooming in
    controls.maxDistance = 5; // Maximum distance for zooming out
    controls.target.set(1, 0, 0);

    scene.add(lineGroup);
    scene.add(starGroup);
    scene.add(hitboxGroup); // Hitbox group to scene

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 10); // Soft white light
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0.000005, 0, 0); // Position at the Sun's location
    scene.add(directionalLight);

    addEarthToScene(); // Add Earth to the scene

    animate();
  }

  function calculateEarthProportion(sunRadius) {
  // Example calculation based on your data
  const earthRadius = 6371; // Earth radius in km (this should be calculated based on your data)
  const sunRadiusKm = sunRadius * 696340; // Convert Sun's radius to km

  // Calculate Earth's proportion relative to the Sun
  const earthProportion = earthRadius / sunRadiusKm;

  return earthProportion;
}


  function addEarthToScene() {
  const sunRadius = SUN_RADIUS; // Assuming SUN_RADIUS is defined somewhere in your code
  const earthRadiusProportion = calculateEarthProportion(sunRadius);

  // Set up the Earth sphere geometry and material
  const geometry = new THREE.SphereGeometry(sunRadius * earthRadiusProportion, 30, 30);

  // Load the Earth texture
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load("/images/earthmap1k.jpg");

  const material = new THREE.MeshStandardMaterial({ map: earthTexture });

  // Create the Earth mesh
  const earthMesh = new THREE.Mesh(geometry, material);

  // Create a container for Earth mesh
  earthContainer = new THREE.Object3D();
  earthContainer.add(earthMesh);

  // Position the Earth at the calculated distance from the Sun
  earthContainer.position.set(1, 0, 0); // Adjust x, y, z as needed
  scene.add(earthContainer); // Add Earth container to the scene

  // Position camera next to Earth and look at it
  // const cameraPosition = new THREE.Vector3().copy(earthContainer.position);
  // cameraPosition.x += 3 * sunRadius * earthRadiusProportion; // Offset from Earth's position for a good view
  // camera.position.copy(cameraPosition);
  // camera.lookAt(earthContainer.position);

  console.log("Earth's center coordinates:", earthContainer.position);
}



  onDestroy(() => {
    if (earthContainer) {
      scene.remove(earthContainer);
      earthContainer = null;
    }
  });

  async function loadAllStars() {
    const url = `https://starapp-api.yannick-schwab.de/api/allstars?minMag=-26.7&maxMag=7`; // Adjusted endpoint to get all stars within the magnitude range
    try {
      const response = await axios.get(url);
      if (clear) {
        lineGroup.clear();
        starGroup.clear();
        hitboxGroup.clear(); // Clear hitbox group
      }
      console.log(response.data.stars);
      const starsData = response.data.stars
        .filter(
          (star) =>
            star.x !== undefined &&
            star.y !== undefined &&
            star.z !== undefined
        )
        .map((star) => ({
          x: star.x,
          y: star.y,
          z: star.z,
          id: star.id,
          absmag: star.absmag,
          ci: star.ci,
          mag: star.mag,
          dist: star.dist,
          ra: star.ra,
          dec: star.dec,
          constellation: star.constellation // Include constellation if available
        }));
      addStars(starsData);
    } catch (error) {
      console.error("Fehler beim Abrufen der Sterndaten:", error);
    }
  }

  function addStars(stars) {
    if (stars.length === 0) {
      console.error("Keine gültigen Sterndaten verfügbar.");
      return;
    }

    stars.forEach((star) => {
      if (star.id === 1) {
        sunIgnored = true; // Mark the Sun as processed
      }

      let starGeometry;
      const originalRadius = berechneSternRadius(star.ci, star.absmag);
      let scaledRadius = mapRadius(
        originalRadius,
        minRadius,
        maxRadius,
        minNewRadius,
        maxNewRadius
      );
      let color = getColorByCI(star.ci);
      let intensity = getIntensityByMag(star.mag);
      if (star.id === 1) {
        color = 0xffff00; // Yellow for the Sun
        intensity = 1.0; // Max intensity for the Sun
      }
      if (isNaN(scaledRadius)) {
        scaledRadius = 0.05;
      }
      if (star.dist < 200) {
        starGeometry = new THREE.SphereGeometry(scaledRadius, 16, 16);
      } else if (star.dist < 400) {
        starGeometry = new THREE.SphereGeometry(scaledRadius, 8, 8);
      } else {
        starGeometry = new THREE.SphereGeometry(scaledRadius, 4, 4);
      }

      const starMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
      });

      const sphere = new THREE.Mesh(starGeometry, starMaterial);

      // Scaling the position of stars
      sphere.position.set(star.y, star.z, star.x);
      sphere.userData.starData = { ...star }; // Attach data
      starGroup.add(sphere);

      // Add invisible hitbox
      const hitboxGeometry = new THREE.SphereGeometry(1, 16, 16); // Size of the hitbox
      const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.position.set(star.y, star.z, star.x);
      hitbox.userData.starData = { ...star }; // Attach data
      hitboxGroup.add(hitbox);
    });
  }

  function addExtraStars(count) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 200; // Extend range
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;

      const star = {
        x: x,
        y: y,
        z: z,
        id: `extra-${i}`,
        absmag: Math.random() * 10 - 5,
        ci: Math.random() * 2 - 1,
        mag: Math.random() * 10,
        dist: Math.random() * 2000,
      };

      let starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const color = getColorByCI(star.ci);
      const intensity = getIntensityByMag(star.mag);
      const starMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
      });

      const sphere = new THREE.Mesh(starGeometry, starMaterial);
      sphere.position.set(star.x, star.y, star.z);
      starGroup.add(sphere);

      // Add invisible hitbox
      const hitboxGeometry = new THREE.SphereGeometry(1, 16, 16); // Size of the hitbox
      const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.position.set(star.x, star.y, star.z);
      hitbox.userData.starData = { ...star }; // Attach data
      hitboxGroup.add(hitbox);
    }
  }

  function addConstellationLines(stars) {
    if (stars.length === 0) {
      console.error("Keine gültigen Sterndaten verfügbar.");
      return;
    }

    for (let i = 1; i < stars.length - 1; i++) {
      const start = stars[i];
      const end = stars[i + 1];
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        start.y, start.z, start.x,
        end.y, end.z, end.x
      ]);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      const material = new THREE.LineBasicMaterial({ color: 0xffffff }); // Line color
      const line = new THREE.Line(geometry, material);
      lineGroup.add(line);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    updateVisibility();
    renderer.render(scene, camera);
    controls.update();
  }

  function updateVisibility() {
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    scene.traverse(function (object) {
      if (object instanceof THREE.Mesh) {
        const wasVisible = object.visible;
        object.visible = frustum.intersectsObject(object);
        if (object.userData.starData && object.userData.starData.id !== undefined) {
          if (object.visible !== wasVisible) {
            // console.log(`Visibility changed for star: ${object.userData.starData.id}, now visible: ${object.visible}`);
          }
        }
      }
    });
  }

  function berechneSternRadius(CI, M) {
    const L_sonne = 3.828e26;
    const sigma = 5.67e-8;
    const pi = Math.PI;

    const T = 4600 * (1 / (0.92 * CI + 1.7) + 1 / (0.92 * CI + 0.62));
    const L = L_sonne * Math.pow(10, 0.4 * (4.83 - M));
    const R = Math.sqrt(L / (4 * pi * sigma * Math.pow(T, 4)));
    const R_sonnen = R / 6.96e8;

    return R_sonnen;
  }

  function mapRadius(originalRadius, minOriginal, maxOriginal, minNew, maxNew) {
    return (
      ((originalRadius - minOriginal) / (maxOriginal - minOriginal)) *
        (maxNew - minNew) +
      minNew
    );
  }

  function getColorByCI(ci) {
    const colors = [
      { ci: -0.4, color: 0x9bb0ff },
      { ci: 0.0, color: 0xaabfff },
      { ci: 0.4, color: 0xfff4e8 },
      { ci: 0.8, color: 0xffd2a1 },
      { ci: 1.2, color: 0xffa070 },
    ];
    let closest = colors.reduce((prev, curr) => Math.abs(curr.ci - ci) < Math.abs(prev.ci - ci) ? curr : prev);
    return closest.color;
  }

  function getIntensityByMag(mag) {
    return mag < maxMag ? 1 - (mag / maxMag) : 0;
  }

  function onMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hitboxGroup.children);

    if (intersects.length > 0) {
      const intersectedStar = intersects[0].object;
      const starData = intersectedStar.userData.starData;
      const starInfo = `
        Stern ID: ${starData.id}
        Entfernung: ${starData.dist} Lichtjahre
        Magnitude: ${starData.mag}
        Farbindex: ${starData.ci}
        Rektaszension: ${starData.ra}
        Deklination: ${starData.dec}
        Konstellation: ${starData.constellation}
      `;
      alert(starInfo);
    }
  }
</script>

<style>
  /* body {
    margin: 0;
  } */
</style>
