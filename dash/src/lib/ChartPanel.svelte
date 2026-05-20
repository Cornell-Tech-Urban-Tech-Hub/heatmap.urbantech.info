<script>
  import { onMount } from 'svelte';
  import { showCharts, filteredFeatures, selectedHHIIndicator } from './stores.js';

  let populationEl;
  let age65El;
  let Plotly;

  onMount(async () => {
    Plotly = (await import('plotly.js-dist-min')).default;
  });

  function close() {
    showCharts.set(false);
  }

  $: if ($showCharts && Plotly && $filteredFeatures.length > 0) {
    requestAnimationFrame(() => {
      renderCharts($filteredFeatures);
    });
  }

  function renderCharts(features) {
    if (!populationEl || !age65El || !Plotly) return;

    const data = { type: 'FeatureCollection', features };

    // Population by risk level
    const popByRisk = {};
    features.forEach(f => {
      const risk = f.properties.raster_value;
      const pop = f.properties.weighted_POP || 0;
      popByRisk[risk] = (popByRisk[risk] || 0) + pop;
    });

    const riskLevels = Object.keys(popByRisk).sort();
    const riskColors = ['#b5d18e', '#fff28c', '#ffa749', '#ff5757', '#a349a4'];

    Plotly.newPlot(populationEl, [{
      x: riskLevels.map(l => popByRisk[l]),
      y: riskLevels.map(l => `Level ${l}`),
      type: 'bar',
      orientation: 'h',
      marker: { color: riskLevels.map(l => riskColors[l]) }
    }], {
      title: { text: 'Population by Risk Level', font: { family: 'DM Sans', size: 14, color: '#ccc' } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'DM Sans', color: '#aaa', size: 11 },
      xaxis: { title: 'Population', gridcolor: 'rgba(255,255,255,0.05)' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
      margin: { l: 60, r: 20, t: 40, b: 40 }
    }, { responsive: true, displayModeBar: false });

    // Age 65+ by risk
    const age65ByRisk = {};
    features.forEach(f => {
      const risk = f.properties.raster_value;
      const age = f.properties.weighted_P_AGE65 || 0;
      if (!age65ByRisk[risk]) age65ByRisk[risk] = { sum: 0, count: 0 };
      age65ByRisk[risk].sum += age;
      age65ByRisk[risk].count += 1;
    });

    const levels2 = Object.keys(age65ByRisk).sort();
    Plotly.newPlot(age65El, [{
      x: levels2.map(l => (age65ByRisk[l].sum / age65ByRisk[l].count).toFixed(2)),
      y: levels2.map(l => `Level ${l}`),
      type: 'bar',
      orientation: 'h',
      marker: { color: levels2.map(l => riskColors[l]) }
    }], {
      title: { text: 'Avg % Aged 65+ by Risk Level', font: { family: 'DM Sans', size: 14, color: '#ccc' } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'DM Sans', color: '#aaa', size: 11 },
      xaxis: { title: '%', gridcolor: 'rgba(255,255,255,0.05)' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
      margin: { l: 60, r: 20, t: 40, b: 40 }
    }, { responsive: true, displayModeBar: false });
  }
</script>

{#if $showCharts}
  <div class="overlay" on:click={close} role="presentation">
    <div class="chart-panel" on:click|stopPropagation role="dialog" aria-label="Charts">
      <div class="chart-header">
        <h2>Analytics</h2>
        <button class="close-btn" on:click={close}>&times;</button>
      </div>
      <div class="chart-body">
        <div bind:this={populationEl} class="chart"></div>
        <div bind:this={age65El} class="chart"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .chart-panel {
    background: rgba(20, 20, 35, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    max-width: 700px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    color: #e0e0e0;
    font-family: 'DM Sans', -apple-system, sans-serif;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .chart-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .close-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .chart-body {
    padding: 16px 24px 24px;
  }
  .chart {
    width: 100%;
    height: 250px;
    margin-bottom: 16px;
  }
</style>
