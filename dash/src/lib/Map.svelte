<script>
  import { onMount, onDestroy } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import { MapboxOverlay } from '@deck.gl/mapbox';
  import { GeoJsonLayer } from '@deck.gl/layers';
  import { filteredFeatures, colorScheme, selectedHHIIndicator, statesData, countiesData, zipcodesData, selectedState, selectedCounty, zipCode } from './stores.js';
  import { colorSchemes } from '../utils/colors.js';
  import { computeBounds } from '../utils/geometry.js';

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  let container;
  let map;
  let overlay;

  let currentHHIIndicator;
  selectedHHIIndicator.subscribe(v => { currentHHIIndicator = v; });

  onMount(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      pitch: 0,
      bearing: 0,
      projection: 'mercator',
      attributionControl: false,
      antialias: true
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    // Use MapboxOverlay so deck.gl shares Mapbox's projection exactly
    overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
      getTooltip: ({ object }) => {
        if (!object) return null;
        const props = object.properties;
        const risk = props.raster_value;
        const hhi = props[currentHHIIndicator];
        return {
          html: `<div class="map-tooltip">
            <span class="tooltip-risk">Risk Level ${risk}</span>
            <span class="tooltip-value">${currentHHIIndicator.replace('weighted_', '').replace(/_/g, ' ')}: ${typeof hhi === 'number' ? hhi.toFixed(2) : 'N/A'}</span>
          </div>`,
          style: {
            background: 'rgba(15, 15, 25, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#e0e0e0',
            fontSize: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }
        };
      }
    });

    map.addControl(overlay);

    map.on('load', () => {
      // Mute labels and hide POIs for a minimal clean look
      const layers = map.getStyle().layers;
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          if (layer.id.includes('poi') || layer.id.includes('transit')) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } else if (layer.layout?.['text-field']) {
            map.setPaintProperty(layer.id, 'text-color', 'rgba(100, 100, 120, 0.45)');
          }
        }
      }
    });
  });

  onDestroy(() => {
    if (map) map.remove();
  });

  // Update layers when filtered features or color scheme changes
  $: if (overlay && $filteredFeatures) {
    updateLayers($filteredFeatures, $colorScheme);
  }

  function updateLayers(features, scheme) {
    const colors = colorSchemes[scheme] || colorSchemes.default;
    const layers = [
      new GeoJsonLayer({
        id: 'heat-risk-layer',
        data: { type: 'FeatureCollection', features },
        pickable: true,
        filled: true,
        stroked: false,
        opacity: 0.65,
        getFillColor: f => colors[f.properties.raster_value] || colors[0],
        autoHighlight: true,
        highlightColor: [255, 255, 255, 60]
      })
    ];

    // Add outline layer if a region is focused
    const outline = getOutlineFeature();
    if (outline) {
      layers.push(new GeoJsonLayer({
        id: 'outline-layer',
        data: { type: 'FeatureCollection', features: [outline] },
        stroked: true,
        filled: false,
        lineWidthMinPixels: 2,
        getLineColor: [255, 255, 255, 180]
      }));
    }

    overlay.setProps({ layers });
  }

  function getOutlineFeature() {
    if ($zipCode) {
      const zf = $zipcodesData?.features?.find(f => f.properties.ZCTA5CE10 === $zipCode);
      if (zf) return zf;
    }
    if ($selectedCounty && $countiesData) {
      const cf = $countiesData.features.find(f =>
        f.properties.NAME === $selectedCounty &&
        (!$selectedState || f.properties.STATE_NAME === $selectedState)
      );
      if (cf) return cf;
    }
    if ($selectedState && $statesData) {
      const sf = $statesData.features.find(f => f.properties.NAME === $selectedState);
      if (sf) return sf;
    }
    return null;
  }

  // Zoom to region when state/county/zip changes
  // Explicitly reference the reactive store values so Svelte tracks them
  $: {
    const _state = $selectedState;
    const _county = $selectedCounty;
    const _zip = $zipCode;
    const _stData = $statesData;
    const _coData = $countiesData;
    const _zipData = $zipcodesData;
    if (map) {
      const outline = getOutlineFeature();
      if (outline) {
        zoomToFeature(outline);
      }
    }
  }

  function zoomToFeature(feature) {
    const bounds = computeBounds(feature.geometry);
    if (!bounds) return;
    const { minLng, minLat, maxLng, maxLat } = bounds;
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 40,
      duration: 800
    });
  }
</script>

<div class="map-container" bind:this={container}></div>

<style>
  .map-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .map-container :global(.mapboxgl-ctrl-bottom-left),
  .map-container :global(.mapboxgl-ctrl-bottom-right) {
    opacity: 0.6;
  }
  :global(.map-tooltip) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  :global(.tooltip-risk) {
    font-weight: 600;
    font-size: 13px;
  }
  :global(.tooltip-value) {
    font-size: 11px;
    opacity: 0.8;
  }
</style>
