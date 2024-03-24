<script>
    import { resultsStore } from "../store.js";
</script>

<h3>Ergebnisse:</h3>
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Bayer</th>
            <th>Flamsteed</th>
            <th>vMag</th>
        </tr>
    </thead>
    <tbody>
        {#each $resultsStore as star}
            <tr>
                <td>{star.proper || ""}</td>
                <td>{star.bayer || ""}</td>
                <td>{star.flam || ""}</td>
                <td>{star.mag || ""}</td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    table {
        border-collapse: collapse;
    }

    th {
        text-align: left;
    }

    thead tr,
    thead tr:hover {
        background-color: #222;
        color: white;
    }

    tr:nth-child(even) {
        background-color: #f2f2f2;
    }

    tr:hover {
        background-color: #ddd;
        cursor: pointer;
    }

    th,
    td {
        padding: 3px 5px;
    }
</style>
