import { writable, derived } from 'svelte/store';

// Filter state
export const selectedDay = writable('Day 1');
export const selectedState = writable('');
export const selectedCounty = writable('');
export const zipCode = writable('');
export const selectedRiskLevels = writable([0, 1, 2, 3, 4]);
export const selectedHHIIndicator = writable('weighted_OVERALL_SCORE');
export const sensitivity = writable(0);
export const colorScheme = writable(localStorage.getItem('colorScheme') || 'default');
export const startDate = writable(new Date());

// Data
export const mapData = writable(null);
export const statesData = writable(null);
export const countiesData = writable(null);
export const zipcodesData = writable(null);
export const hhiDescriptions = writable([]);

// UI state
export const showInfo = writable(false);
export const showCharts = writable(false);
export const panelCollapsed = writable(false);

// Derived: filtered features for the map
export const filteredFeatures = derived(
  [mapData, selectedRiskLevels, selectedHHIIndicator, sensitivity],
  ([$mapData, $riskLevels, $hhiIndicator, $sensitivity]) => {
    if (!$mapData || !$mapData.features) return [];

    const threshold = calculatePercentileThreshold($mapData, $hhiIndicator, $sensitivity);

    return $mapData.features.filter(feature => {
      const riskLevel = feature.properties.raster_value;
      const hhiValue = feature.properties[$hhiIndicator];
      const riskMatch = $riskLevels.includes(riskLevel);
      const hhiMatch = hhiValue !== null && !isNaN(hhiValue) && hhiValue >= threshold;
      return riskMatch && hhiMatch;
    });
  }
);

function calculatePercentileThreshold(data, indicator, percentile) {
  const values = data.features
    .map(f => f.properties[indicator])
    .filter(v => v !== null && !isNaN(v));
  values.sort((a, b) => a - b);
  if (values.length === 0) return 0;
  if (percentile <= 0) return values[0];
  if (percentile >= 100) return values[values.length - 1];
  const index = Math.floor(percentile / 100 * values.length);
  return values[index] || 0;
}

// Persist color scheme
colorScheme.subscribe(value => {
  localStorage.setItem('colorScheme', value);
});
