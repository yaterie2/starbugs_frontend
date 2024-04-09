<script>
    import { resultsStore } from "../store.js";
    // Berechnen des Radius basierend auf der Helligkeit des Sterns
    function calculateRadius(magnitude) {
        return Math.max(2, 10 - magnitude); // Beispiel: Je heller der Stern, desto kleiner der Radius
    }

    // Berechnen der Deckkraft basierend auf der Helligkeit des Sterns
    function calculateOpacity(magnitude) {
        return Math.min(1, 1 / magnitude); // Beispiel: Je heller der Stern, desto höher die Deckkraft
    }
</script>

<h3>Ergebnisse: style="color: white"</h3>

<svg width="100%" height="500">
    <!-- Weißer Stern mit variabler Deckkraft -->
    {#each $resultsStore as star}
        {#if star.mag !== undefined}
            <g>
                <circle cx="{50 + (star.positionX - 50)}" cy="{50 + (star.positionY - 50)}" r="{calculateRadius(star.mag)}" fill="white" opacity="{calculateOpacity(star.mag)}"
                    on:mouseenter={() => { star.hovered = true }} 
                    on:mouseleave={() => { star.hovered = false }}></circle>
                <!-- HTML-Elemente zur Anzeige der Ergebnisse -->
                {#if star.hovered}
                    <foreignObject x="{50 + (star.positionX - 50) - 50}" y="{50 + (star.positionY - 50) - 30}" width="100" height="20">
                        <div style="color: white;">{star.proper || ""}</div>
                        <div style="color: white;">Bayer: {star.bayer || ""}</div>
                        <div style="color: white;">Flamsteed: {star.flam || ""}</div>
                        <div style="color: white;">vMag: {star.mag || ""}</div>
                    </foreignObject>
                {/if}
            </g>
        {/if}
    {/each}
</svg>

<style>
    /* Fügen Sie hier keine Stile hinzu, da SVG-Elemente inline-stilisiert sind */
</style>

