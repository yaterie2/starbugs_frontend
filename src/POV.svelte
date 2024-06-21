<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { writable } from 'svelte/store';

  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();

  let camera, scene, renderer, controls;
  let loading = writable(false);
  let errorMessage = writable('');

  const maxMag = 8;
  const minRadius = 0.17;
  const maxRadius = 1587.37;
  const minNewRadius = 0.05; // Mindestgröße für Sichtbarkeit
  const maxNewRadius = 0.3; // Maximalgröße für die Darstellung
  let selectedArray;
  let sunIgnored = false;

  let lineGroup = new THREE.Group();
  let starGroup = new THREE.Group();
  let hitboxGroup = new THREE.Group(); // Gruppe für die Hitboxen
  let clear = false;

  const extraStarsCount = 5000; // Anzahl der zusätzlichen zufälligen Sterne

  onMount(() => {
    init();
    loadAllStars(); // Load all stars within the magnitude range
    addExtraStars(extraStarsCount); // Füge zusätzliche zufällige Sterne hinzu

    // Event-Listener für Maus-Klicks hinzufügen
    renderer.domElement.addEventListener("click", onMouseClick);
  });

  function init() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.z = 0.0001;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Setzen Sie explizit eine Hintergrundfarbe

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // Stellen Sie sicher, dass dies ausgeführt wird

    controls = new OrbitControls(camera, renderer.domElement);

    scene.add(lineGroup);
    scene.add(starGroup);
    scene.add(hitboxGroup); // Hitbox-Gruppe zur Szene hinzufügen
    animate();
  }

  async function loadAllStars() {
    loading.set(true);
    const url = `https://starapp-api.yannick-schwab.de/allstars?minMag=-26.7&maxMag=7`; // Adjusted endpoint to get all stars within the magnitude range
    try {
      const response = await axios.get(url);
      if (clear) {
        lineGroup.clear();
        starGroup.clear();
        hitboxGroup.clear(); // Hitbox-Gruppe leeren
      }
      const starsData = response.data.stars
        .filter(
          (star) =>
            star.x0 !== undefined &&
            star.y0 !== undefined &&
            star.z0 !== undefined
        )
        .map((star) => ({
          x: star.x0,
          y: star.y0,
          z: star.z0,
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
      loading.set(false);
    } catch (error) {
      console.error("Fehler beim Abrufen der Sterndaten:", error);
      errorMessage.set('Fehler beim Laden der Sterne');
      loading.set(false);
    }
  }

  function addStars(stars) {
    if (stars.length === 0) {
      console.error("Keine gültigen Sterndaten verfügbar.");
      return;
    }

    stars.forEach((star) => {
      if (star.id === 1 && sunIgnored == false) {
        sunIgnored = true;
        return;
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
        color = 0xff0000;
        intensity = 0xff0000;
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

      // Skalierung der Position der Sterne
      sphere.position.set(star.y, star.z, star.x);
      sphere.userData.starData = { ...star }; // Daten anhängen
      starGroup.add(sphere);

      // Hinzufügen der unsichtbaren Hitbox
      const hitboxGeometry = new THREE.SphereGeometry(1, 16, 16); // Größe der Hitbox
      const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.position.set(star.y, star.z, star.x);
      hitbox.userData.starData = { ...star }; // Daten anhängen
      hitboxGroup.add(hitbox);
    });
  }

  function addExtraStars(count) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 200; // Bereich erweitern
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

      // Hinzufügen der unsichtbaren Hitbox
      const hitboxGeometry = new THREE.SphereGeometry(1, 16, 16); // Größe der Hitbox
      const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.position.set(star.x, star.y, star.z);
      hitbox.userData.starData = { ...star }; // Daten anhängen
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
      const material = new THREE.LineBasicMaterial({ color: 0xffffff }); // Farbe der Linie
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
        object.visible = frustum.intersectsObject(object);
      }
    });
  }

  function berechneSternRadius(ci, absmag) {
    const L0 = 3.0128e28;
    const T0 = 5778;
    const L = L0 * Math.pow(10, 0.4 * (4.75 - absmag));
    const T = T0 * Math.pow(10, 0.92 * ci);
    const radius = Math.sqrt(L) / Math.pow(T, 2);
    return radius;
  }

  function mapRadius(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
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
  body {
    margin: 0;
  }
</style>