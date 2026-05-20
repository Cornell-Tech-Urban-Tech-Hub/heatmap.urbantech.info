<script>
  import { riskLabels } from '../utils/colors.js';
  import { selectedRiskLevels } from './stores.js';
</script>

<div class="legend">
  {#each riskLabels as { level, label, color }}
    <div class="legend-item" class:dimmed={!$selectedRiskLevels.includes(level)}>
      <span class="legend-swatch" style="background: {color}"></span>
      <span class="legend-label">{label}</span>
    </div>
  {/each}
</div>

<style>
  .legend {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    background: rgba(15, 15, 25, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 8px 14px;
    z-index: 10;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    transition: opacity 0.2s;
  }
  .legend-item.dimmed {
    opacity: 0.3;
  }
  .legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .legend-label {
    font-size: 11px;
    color: #bbb;
    font-family: 'DM Sans', -apple-system, sans-serif;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .legend {
      bottom: auto;
      top: 16px;
      left: 50%;
      font-size: 10px;
      padding: 6px 10px;
    }
  }
</style>
