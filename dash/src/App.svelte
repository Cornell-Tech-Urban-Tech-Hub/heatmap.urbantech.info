<script>
  import { onMount } from 'svelte';
  import Map from './lib/Map.svelte';
  import ControlPanel from './lib/ControlPanel.svelte';
  import Legend from './lib/Legend.svelte';
  import InfoPanel from './lib/InfoPanel.svelte';
  import ChartPanel from './lib/ChartPanel.svelte';
  import { statesData, countiesData, zipcodesData, hhiDescriptions } from './lib/stores.js';
  import { fetchGeoParquet } from './utils/parquet.js';
  import Papa from 'papaparse';

  onMount(async () => {
    // Load geographic reference data in parallel
    const [states, counties, zipcodes] = await Promise.all([
      fetchGeoParquet('/data/us_states_reduced.parquet'),
      fetchGeoParquet('/data/us_counties_reduced.parquet'),
      fetchGeoParquet('/data/us_zipcodes_reduced.parquet')
    ]);

    statesData.set(states);
    countiesData.set(counties);
    zipcodesData.set(zipcodes);

    // Load HHI descriptions
    const response = await fetch('/data/HHI_Data_Dictionary_2024.csv');
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    hhiDescriptions.set(parsed.data);
  });
</script>

<main>
  <Map />
  <ControlPanel />
  <Legend />
  <InfoPanel />
  <ChartPanel />
  <a href="https://urbantech.cornell.edu/" target="_blank" class="logo-link">
    <img src="/img/jacobs-logo.png" alt="Jacobs Urban Tech Hub" class="floating-logo" />
  </a>
</main>

<style>
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  .logo-link {
    position: absolute;
    bottom: 24px;
    left: 16px;
    z-index: 10;
    opacity: 0.85;
    transition: opacity 0.2s;
  }
  .logo-link:hover {
    opacity: 1;
  }
  .floating-logo {
    height: 96px;
    width: auto;
    display: block;
  }
</style>
