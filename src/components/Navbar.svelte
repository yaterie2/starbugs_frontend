<script>
import { resultsStore } from "../store.js";
    import { onMount } from "svelte";
    import axios from "axios";

    async function fetchStars() {
        const API_URL = `${
            import.meta.env.VITE_API_BASE_URL
        }/constellation?constellation=${selectedConstellation}`;
         console.log(API_URL);
        try {
            const response = await axios.get(API_URL);
            resultsStore.set(response.data);
        } catch (error) {
            console.error("Fehler beim Abrufen der Sterndaten:", error);
        }
    }
    </script>

<svg width="100%" height="100px" fill="white">
    <rect width="100%" height="100px" fill="black"></rect>
    </svg>