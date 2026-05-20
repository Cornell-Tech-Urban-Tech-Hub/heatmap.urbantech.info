<script>
  import { selectedDay, selectedState, selectedCounty, zipCode, selectedRiskLevels, selectedHHIIndicator, sensitivity, startDate, statesData, countiesData, hhiDescriptions, panelCollapsed, showInfo, showCharts } from './stores.js';
  import { fetchGeoParquetWithFallback } from '../utils/parquet.js';
  import { mapData } from './stores.js';

  let states = [];
  let counties = [];
  let hhiOptions = [];
  let dayOptions = [];
  let hhiDescription = '';

  const labelMapping = {
    'weighted_OVERALL_SCORE': 'Overall HHI Score',
    'weighted_OVERALL_RANK': 'Overall HHI Rank',
    'weighted_HHB_SCORE': 'Heat Burden Score',
    'weighted_SEN_SCORE': 'Sensitivity Score',
    'weighted_SOCIODEM_SCORE': 'Sociodemographic Score',
    'weighted_NBE_SCORE': 'Built Environment Score',
    'weighted_P_AGE65': 'Aged 65+ (%)',
    'weighted_P_AGE5': 'Under 5 (%)',
    'weighted_P_ASTHMA': 'Asthma (%)',
    'weighted_P_CHD': 'Heart Disease (%)',
    'weighted_P_COPD': 'COPD (%)',
    'weighted_P_DIABETES': 'Diabetes (%)',
    'weighted_P_DISABL': 'Disability (%)',
    'weighted_P_ELP': 'Limited English (%)',
    'weighted_P_IMPERV': 'Impervious Surface (%)',
    'weighted_P_ISO': 'Living Alone (%)',
    'weighted_P_MOBILE': 'Mobile Homes (%)',
    'weighted_P_NEHD': 'Extreme Heat Days',
    'weighted_P_NOHSDP': 'No HS Diploma (%)',
    'weighted_P_NOVEH': 'No Vehicle (%)',
    'weighted_P_OBS': 'Obesity (%)',
    'weighted_P_ODW': 'Outdoor Workers (%)',
    'weighted_P_OZONE': 'Ozone Days',
    'weighted_P_PM25': 'PM2.5 Days',
    'weighted_P_POV': 'Poverty (%)',
    'weighted_P_RENT': 'Renters (%)',
    'weighted_P_TREEC': 'Tree Canopy (%)',
    'weighted_P_UNEMP': 'Unemployment (%)',
    'weighted_P_UNINSUR': 'Uninsured (%)',
    'weighted_POP': 'Population'
  };

  // Generate day options
  $: {
    const base = $startDate;
    dayOptions = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dayOptions.push({
        value: `Day ${i + 1}`,
        label: `Day ${i + 1} — ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    }
  }

  // Populate states from data
  statesData.subscribe(data => {
    if (data?.features) {
      states = data.features
        .map(f => f.properties.NAME)
        .sort();
    }
  });

  // Populate counties from data
  $: {
    if ($countiesData?.features) {
      let filtered = $countiesData.features;
      if ($selectedState) {
        filtered = filtered.filter(f => f.properties.STATE_NAME === $selectedState);
      }
      counties = filtered.map(f => f.properties.NAME).sort();
    }
  }

  // Populate HHI options
  hhiDescriptions.subscribe(data => {
    if (data?.length) {
      hhiOptions = data
        .filter(d => labelMapping[d.weighted_2024_VARIABLE_NAME])
        .map(d => ({
          value: d.weighted_2024_VARIABLE_NAME,
          label: labelMapping[d.weighted_2024_VARIABLE_NAME]
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  });

  // Update HHI description
  $: {
    const desc = $hhiDescriptions.find(d => d.weighted_2024_VARIABLE_NAME === $selectedHHIIndicator);
    hhiDescription = desc?.['2024_DESCRIPTION'] || '';
  }

  // Load data when day changes
  $: loadDay($selectedDay, $startDate);

  async function loadDay(day, base) {
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const dayStr = String(base.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${dayStr}`;

    const yesterday = new Date(base);
    yesterday.setDate(base.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const formattedYesterday = `${yYear}${yMonth}${yDay}`;

    const primary = `https://heat-risk-dashboard.s3.amazonaws.com/heat_risk_analysis_${day}_${formattedDate}.geoparquet`;
    const fallback = `https://heat-risk-dashboard.s3.amazonaws.com/heat_risk_analysis_${day}_${formattedYesterday}.geoparquet`;

    try {
      const data = await fetchGeoParquetWithFallback(primary, fallback);
      mapData.set(data);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }

  function toggleRiskLevel(level) {
    selectedRiskLevels.update(levels => {
      if (levels.includes(level)) {
        return levels.filter(l => l !== level);
      }
      return [...levels, level];
    });
  }

  function handleStartDateChange(e) {
    const [y, m, d] = e.target.value.split('-').map(Number);
    startDate.set(new Date(y, m - 1, d));
  }

  const riskColors = ['#b5d18e', '#fff28c', '#ffa749', '#ff5757', '#a349a4'];
  const riskNames = ['None', 'Minor', 'Moderate', 'Major', 'Extreme'];
</script>

<div class="control-panel" class:collapsed={$panelCollapsed}>
  <div class="panel-header">
    <h1 class="panel-title">Heat Risk Dashboard</h1>
    <div class="panel-actions">
      <button class="icon-btn" on:click={() => showCharts.set(true)} title="Charts">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
      </button>
      <button class="icon-btn" on:click={() => showInfo.set(true)} title="Info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </button>
      <button class="icon-btn" on:click={() => panelCollapsed.update(v => !v)} title="Toggle panel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          {#if $panelCollapsed}
            <polyline points="9 18 15 12 9 6"/>
          {:else}
            <polyline points="15 18 9 12 15 6"/>
          {/if}
        </svg>
      </button>
    </div>
  </div>

  {#if !$panelCollapsed}
    <div class="panel-body">
      <p class="panel-instructions">This app provides a unified geo-referenced overlay of NWS HeatRisk forecasts and CDC Heat and Health Index indicators for the United States.</p>
      <p class="panel-instructions">Choose a geography, forecast day (or historic forecast date), risk levels and a health indicator to view intersections of heat exposure and population vulnerability.</p>

      <section>
        <label class="section-label">Location</label>
        <select bind:value={$selectedState} on:change={() => selectedCounty.set('')}>
          <option value="">All States</option>
          {#each states as state}
            <option value={state}>{state}</option>
          {/each}
        </select>
        <select bind:value={$selectedCounty}>
          <option value="">All Counties</option>
          {#each counties as county}
            <option value={county}>{county}</option>
          {/each}
        </select>
        <input type="text" bind:value={$zipCode} placeholder="ZIP code">
      </section>

      <section>
        <label class="section-label">Forecast Day</label>
        <select bind:value={$selectedDay}>
          {#each dayOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <input type="date" on:change={handleStartDateChange}>
      </section>

      <section>
        <label class="section-label">Risk Levels</label>
        <div class="risk-chips">
          {#each [0, 1, 2, 3, 4] as level}
            <button
              class="risk-chip"
              class:active={$selectedRiskLevels.includes(level)}
              style="--chip-color: {riskColors[level]}"
              on:click={() => toggleRiskLevel(level)}
            >
              {riskNames[level]}
            </button>
          {/each}
        </div>
      </section>

      <section>
        <label class="section-label">Health Indicator</label>
        <select bind:value={$selectedHHIIndicator}>
          {#each hhiOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        {#if hhiDescription}
          <p class="indicator-desc">{hhiDescription}</p>
        {/if}
      </section>

      <section>
        <label class="section-label">Sensitivity: {$sensitivity}%</label>
        <input type="range" min="0" max="90" step="10" bind:value={$sensitivity} class="range-slider">
      </section>
    </div>
  {/if}
</div>

<style>
  .control-panel {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 320px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: rgba(15, 15, 25, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    color: #e8e8ec;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 13px;
    letter-spacing: -0.01em;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    transition: width 0.3s ease, opacity 0.3s ease;
    z-index: 10;
  }
  .control-panel.collapsed {
    width: auto;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .panel-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #ff6b35, #ff2d2d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .panel-actions {
    display: flex;
    gap: 4px;
  }
  .icon-btn {
    background: rgba(255, 255, 255, 0.05);
    border: none;
    color: #aaa;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  .panel-body {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
  }
  select, input[type="text"], input[type="date"] {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e0e0e0;
    padding: 8px 10px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }
  select:focus, input:focus {
    border-color: rgba(255, 107, 53, 0.5);
  }
  select option {
    background: #1a1a2e;
    color: #e0e0e0;
  }
  .risk-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .risk-chip {
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.04);
    color: #aaa;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .risk-chip.active {
    background: var(--chip-color);
    color: #111;
    border-color: var(--chip-color);
    font-weight: 600;
  }
  .risk-chip:hover {
    border-color: var(--chip-color);
  }
  .range-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, rgba(255,255,255,0.1), #ff6b35);
    outline: none;
    border: none;
    padding: 0;
  }
  .range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ff6b35;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
  }
  .panel-instructions {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
    margin: 0 0 4px;
  }
  .indicator-desc {
    font-size: 11px;
    color: #777;
    line-height: 1.4;
    margin: 0;
  }
  /* Scrollbar */
  .control-panel::-webkit-scrollbar {
    width: 4px;
  }
  .control-panel::-webkit-scrollbar-track {
    background: transparent;
  }
  .control-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  @media (max-width: 640px) {
    .control-panel {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 50vh;
      border-radius: 16px 16px 0 0;
    }
  }
</style>
