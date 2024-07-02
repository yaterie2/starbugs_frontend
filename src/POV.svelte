<script>
  import { onMount, onDestroy } from "svelte";
  import axios from "axios";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { writable } from "svelte/store";

  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();

  let camera, scene, renderer, controls;
  let earthContainer;
  const SUN_POSITION = { x: 0.000005, y: 0, z: 0 };

  const maxMag = 8;
  const minRadius = 0.17;
  const maxRadius = 1587.37;
  const minNewRadius = 0.008; // Minimum size for stars
  const maxNewRadius = 0.5; // Maximum size for stars
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

  const selectedMonth = writable(0); // Store for selected month index

  onMount(() => {
    init();
    loadAllStars(); // Load all stars within the magnitude range
    renderer.domElement.addEventListener("click", onMouseClick);
    // Subscribe to selectedMonth changes
    selectedMonth.subscribe(value => {
      if (earthContainer) {
        let newPosition = calculatePosition(ephemerisData[value]);
        newPosition = scalePosition(newPosition);
        earthContainer.position.set(newPosition.x, newPosition.y, newPosition.z);
        console.log("Scaled Earth's center coordinates:", earthContainer.position);
      }
    });
    return () => {
      // Cleanup code on component destroy
      renderer.dispose();
    };
  });

  function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.01;
  controls.maxDistance = 5;

  scene.add(lineGroup);
  scene.add(starGroup);
  scene.add(hitboxGroup);

  const ambientLight = new THREE.AmbientLight(0x404040, 10);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(0.000005, 0, 0);
  scene.add(directionalLight);

  const sunCoordinates = { x: 0.000005, y: 0, z: 0 }; // Coordinates of the Sun
  addEarthToScene(sunCoordinates);

  const lightTarget = new THREE.Object3D();
  scene.add(lightTarget);
  directionalLight.target = lightTarget;

  function updateLightTarget() {
    if (earthContainer) {
      lightTarget.position.copy(earthContainer.position);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls every frame
    updateLightTarget();
    renderer.render(scene, camera);
  }

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

// Define the ephemeris data (for simplicity, only including a few months; include all your data)
const ephemerisData = [
  { date: "Jun", EC: 0.01596509390043108, QR: 147317044.2672472, IN: 0.002865571752163338, OM: 172.3363714587514, W: 290.8517886555517, A: 149707132.6983405 },
  { date: "Jul", EC: 0.01612356552148498, QR: 147285548.3970081, IN: 0.002446577014105491, OM: 195.0988375989005, W: 266.7476554084329, A: 149699233.8017263 },
  { date: "Aug", EC: 0.01657814019931592, QR: 147194089.3882608, IN: 0.001510142792070378, OM: 208.7746630048802, W: 252.3848152811628, A: 149675429.6453136 },
  { date: "Sep", EC: 0.01700284283699078, QR: 147101271.0365701, IN: 0.001567855314401316, OM: 172.3167164041436, W: 289.4556639657400, A: 149645672.8940230 },
  { date: "Oct", EC: 0.01714382502432464, QR: 147068611.8246605, IN: 0.002771136914541137, OM: 171.2947628178649, W: 291.3692240274728, A: 149633909.3848602 },
  { date: "Nov", EC: 0.01691686190627082, QR: 147054801.2241627, IN: 0.003965027618347941, OM: 193.6944228867873, W: 270.4933096951783, A: 149585315.3470955 },
  { date: "Dec", EC: 0.01658695562473216, QR: 147084285.1996146, IN: 0.003664581439303683, OM: 208.5961649873923, W: 255.8561437427800, A: 149565115.1272380 },
  { date: "Jan", EC: 0.01614191598931738, QR: 147109037.4869135, IN: 0.002729669294297828, OM: 201.6290968751990, W: 261.9736020956153, A: 149522619.0419920 },
  { date: "Feb", EC: 0.01607621544888998, QR: 147092315.9454004, IN: 0.003413242915505638, OM: 175.5464906934141, W: 286.3397893233022, A: 149495640.0637347 },
  { date: "Mar", EC: 0.01629785798810066, QR: 147072940.1804569, IN: 0.004142102568587032, OM: 177.5415006860021, W: 283.7921805188711, A: 149509626.8466577 },
  { date: "Apr", EC: 0.01672383664639080, QR: 146989755.9058919, IN: 0.004958459197320729, OM: 188.6602639460047, W: 271.9049997834522, A: 149489798.8827082 },
  { date: "May", EC: 0.01712281963230739, QR: 146924752.9738537, IN: 0.004469126532953342, OM: 198.0414875405646, W: 262.9000754938207, A: 149484346.4764229 },
  // { date: "Jun", EC: 0.01751524667275575, QR: 146849313.5642464, IN: 0.003397103623035110, OM: 188.4318602808716, W: 273.7772434229361, A: 149467269.6618775 },
];

let wheelRotation = 0;

// Set initial selected month to June
const initialMonthIndex = ephemerisData.findIndex(item => item.date === "Jun");
selectedMonth.set(initialMonthIndex);

selectedMonth.subscribe(index => {
  const degreesPerItem = 360 / ephemerisData.length;
  wheelRotation = -index * degreesPerItem;

  // Update Earth's position when month is selected
  let newPosition = calculatePosition(ephemerisData[index]);
  newPosition = scalePosition(newPosition);
  if (earthContainer) {
    earthContainer.position.set(newPosition.x, newPosition.y, newPosition.z);
  }
});

function isSelected(index) {
  return index === $selectedMonth;
}

// Convert degrees to radians
function degToRad(deg) {
  return deg * Math.PI / 180;
}

// Kepler's Equation Solver (simplified for illustration)
function solveKeplerEquation(M, e, tolerance = 1e-6) {
  let E = M;
  let delta = 1;
  while (delta > tolerance) {
    let E_next = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    delta = Math.abs(E_next - E);
    E = E_next;
  }
  return E;
}

// Calculate position using orbital elements
function calculatePosition(orbitalElements) {
  const { EC, QR, IN, OM, W, A } = orbitalElements;

  // Semi-major axis and eccentricity
  const a = A;
  const e = EC;

  // Mean anomaly
  const M = 0;  // For simplicity, assuming M = 0 (periapsis)

  // Solve Kepler's equation for E (Eccentric Anomaly)
  const E = solveKeplerEquation(M, e);

  // True anomaly
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

  // Distance to Sun
  const r = a * (1 - e * Math.cos(E));

  // Heliocentric coordinates in the orbital plane
  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);
  const z = 0;

  // Convert to ecliptic coordinates
  const xEcliptic = (x * (Math.cos(degToRad(W)) * Math.cos(degToRad(OM)) - Math.sin(degToRad(W)) * Math.sin(degToRad(OM)) * Math.cos(degToRad(IN)))) - 
                    (y * (Math.sin(degToRad(W)) * Math.cos(degToRad(OM)) + Math.cos(degToRad(W)) * Math.sin(degToRad(OM)) * Math.cos(degToRad(IN))));

  const yEcliptic = (x * (Math.cos(degToRad(W)) * Math.sin(degToRad(OM)) + Math.sin(degToRad(W)) * Math.cos(degToRad(OM)) * Math.cos(degToRad(IN)))) + 
                    (y * (Math.cos(degToRad(W)) * Math.cos(degToRad(OM)) - Math.sin(degToRad(W)) * Math.sin(degToRad(OM)) * Math.cos(degToRad(IN))));

  const zEcliptic = (x * (Math.sin(degToRad(W)) * Math.sin(degToRad(IN)))) + 
                    (y * (Math.cos(degToRad(W)) * Math.sin(degToRad(IN))));

  return { x: xEcliptic, y: yEcliptic, z: zEcliptic };
}

// Scale the position for visualization
function scalePosition(position) {
  const positions = ephemerisData.map(data => calculatePosition(data));
  const maxX = Math.max(...positions.map(pos => Math.abs(pos.x)));
  const maxY = Math.max(...positions.map(pos => Math.abs(pos.y)));

  const scaleX = 1.5 / maxX;
  const scaleY = 1.5 / maxY;

  return {
    x: position.x * scaleX,
    y: position.y * scaleY,
    z: position.z * Math.min(scaleX, scaleY)
  };
}

function calculateOrbitPoints(orbitalElements, numPoints = 100) {
  const { EC, QR, IN, OM, W, A } = orbitalElements;

  // Array to store points
  const points = [];

  // Calculate points along the orbit
  for (let i = 0; i < numPoints; i++) {
    const M = (i / numPoints) * 2 * Math.PI; // Mean anomaly from 0 to 2π
    const E = solveKeplerEquation(M, EC); // Eccentric Anomaly using Kepler's equation
    const nu = 2 * Math.atan2(Math.sqrt(1 + EC) * Math.sin(E / 2), Math.sqrt(1 - EC) * Math.cos(E / 2)); // True anomaly

    // Distance to Sun
    const r = A * (1 - EC * Math.cos(E));

    // Heliocentric coordinates in the orbital plane
    const x = r * Math.cos(nu);
    const y = r * Math.sin(nu);
    const z = 0;

    // Convert to ecliptic coordinates
    const xEcliptic = x * (Math.cos(degToRad(W)) * Math.cos(degToRad(OM)) - Math.sin(degToRad(W)) * Math.sin(degToRad(OM)) * Math.cos(degToRad(IN)));
    const yEcliptic = y * (Math.cos(degToRad(W)) * Math.sin(degToRad(OM)) + Math.sin(degToRad(W)) * Math.cos(degToRad(OM)) * Math.cos(degToRad(IN)));
    const zEcliptic = z * (Math.sin(degToRad(W)) * Math.sin(degToRad(IN)));

    points.push(new THREE.Vector3(xEcliptic, yEcliptic, zEcliptic));
  }

  return points.map(scalePosition); // Apply scaling to each point
}

function drawOrbit(points) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const orbitLine = new THREE.Line(geometry, material);
  scene.add(orbitLine);
}

function addEarthToScene(sunCoordinates) {
    const sunRadius = SUN_RADIUS;
    const earthRadiusProportion = calculateEarthProportion(sunRadius);

    const geometry = new THREE.SphereGeometry(sunRadius * earthRadiusProportion, 30, 30);

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/images/earthmap1k.jpg", () => {
        const material = new THREE.MeshStandardMaterial({ map: earthTexture });
        const earthMesh = new THREE.Mesh(geometry, material);
        earthMesh.rotation.z = THREE.MathUtils.degToRad(45);

        earthContainer = new THREE.Object3D();
        earthContainer.add(earthMesh);
        earthContainer.rotation.z = THREE.MathUtils.degToRad(23.5);

        let initialPosition = calculatePosition(ephemerisData[0], sunCoordinates);
        initialPosition = scalePosition(initialPosition);
        earthContainer.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

        scene.add(earthContainer);

        // Initialize the camera position and controls target here
        const cameraDistance = 0.03; // Distance from Earth
        const cameraPosition = new THREE.Vector3(earthContainer.position.x + cameraDistance, earthContainer.position.y, earthContainer.position.z);
        camera.position.copy(cameraPosition);

        const lookAtPosition = new THREE.Vector3(earthContainer.position.x, earthContainer.position.y, earthContainer.position.z);
        camera.lookAt(lookAtPosition);

        controls.target.copy(earthContainer.position);
        controls.update(); // Ensure controls are updated after setting target

        // Calculate and draw orbit
        const orbitPoints = calculateOrbitPoints(ephemerisData[0]);
        drawOrbit(orbitPoints);

        function animateEarthRotation() {
            requestAnimationFrame(animateEarthRotation);
            const rotationSpeed = (2 * Math.PI) / (24 * 60 * 60);
            earthMesh.rotation.y += rotationSpeed * (1 / 60);
            renderer.render(scene, camera);
        }

        let currentMonthIndex = 0;
        const monthDuration = 1 / 12;
        let elapsedTime = 0;

        function animateEarth() {
            requestAnimationFrame(animateEarth);

            elapsedTime += 1 / 60 / 60 / 24;
            if (elapsedTime >= monthDuration) {
                currentMonthIndex = (currentMonthIndex + 1) % ephemerisData.length;
                let newPosition = calculatePosition(ephemerisData[currentMonthIndex]);
                newPosition = scalePosition(newPosition);
                earthContainer.position.set(newPosition.x, newPosition.y, newPosition.z);
                elapsedTime = 0;
            }

            renderer.render(scene, camera);
        }

        animateEarth();
        animateEarthRotation();
    });
}

onDestroy(() => {
    if (earthContainer) {
        scene.remove(earthContainer);
        earthContainer = null;
    }
    renderer.domElement.removeEventListener("click", onMouseClick);
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

  // function addConstellationLines(stars) {
  //   if (stars.length === 0) {
  //     console.error("Keine gültigen Sterndaten verfügbar.");
  //     return;
  //   }

  //   for (let i = 1; i < stars.length - 1; i++) {
  //     const start = stars[i];
  //     const end = stars[i + 1];
  //     const geometry = new THREE.BufferGeometry();
  //     const vertices = new Float32Array([
  //       start.y, start.z, start.x,
  //       end.y, end.z, end.x
  //     ]);
  //     geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  //     const material = new THREE.LineBasicMaterial({ color: 0xffffff }); // Line color
  //     const line = new THREE.Line(geometry, material);
  //     lineGroup.add(line);
  //   }
  // }

  // function animate() {
  //   requestAnimationFrame(animate);
  //   updateVisibility();
  //   renderer.render(scene, camera);
  //   controls.update();
  // }

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

<div class="wheel-container">
  <div class="wheel" style="transform: rotate({wheelRotation}deg);">
    {#each ephemerisData as data, index}
      <button
        type="button"
        class="month"
        class:before={isSelected(index)}
        on:click={() => selectedMonth.set(index)}
        style="transform: rotate({index * (360 / ephemerisData.length)}deg) translate(0, -6em) rotate(-{index * (360 / ephemerisData.length)}deg);"
      >
        {data.date}
      </button>
    {/each}
  </div>
</div>

<style>
  .wheel-container {
    position: absolute;
    top: 0;
    left: 0;
    margin-left: 3.5em;
    margin-top: 6em;
  }

  .wheel {
    position: relative;
    width: 12em;
    height: 12em;
    border: 2px solid rgb(216, 103, 103);
    border-radius: 50%;
    background-color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.5s ease; /* Smooth transition for rotation */
  }

  .month {
    position: absolute;
    width: 3em;
    height: 3em;
    border: none;
    background: none;
    color: rgb(149, 120, 120);
    font-size: 0.8em;
    text-align: center;
    line-height: 3em;
    transform-origin: center;
    pointer-events: all;
    cursor: pointer;
  }

  .month:focus,
  .month::before {
    outline: none;
    color: #ffffff;
  }

  .month:hover {
    outline: none;
    color: #dddddd;
  }
</style>