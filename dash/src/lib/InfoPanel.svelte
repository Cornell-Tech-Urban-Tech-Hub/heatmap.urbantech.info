<script>
  import { showInfo, colorScheme } from './stores.js';

  function close() {
    showInfo.set(false);
  }
</script>

{#if $showInfo}
  <div class="overlay" on:click={close} role="presentation">
    <div class="info-panel" on:click|stopPropagation role="dialog" aria-label="About">
      <div class="info-header">
        <h2>About This Dashboard</h2>
        <button class="close-btn" on:click={close}>&times;</button>
      </div>
      <div class="info-body">
        <p>This app provides a unified geo-referenced overlay of NWS HeatRisk forecasts and CDC Heat and Health Index indicators for the United States.</p>

        <p>This is an experimental prototype provided for informational purposes only by the <a href="https://urbantech.cornell.edu/" target="_blank">Urban Tech Hub</a> at Cornell Tech as part of the <a href="https://extremeheat.us/" target="_blank">Cornell Initiative on Aging and Adaptation to Extreme Heat</a>.</p>

        <p><a href="https://cornell.ca1.qualtrics.com/jfe/form/SV_4TTfOiGyOZJNVP0" target="_blank">Provide feedback</a> &middot; <a href="mailto:urbantech@cornell.edu">Report bugs</a></p>

        <h3>Data Sources</h3>
        <ul>
          <li><a href="https://www.wpc.ncep.noaa.gov/heatrisk/" target="_blank">NWS Heat Risk</a></li>
          <li><a href="https://ephtracking.cdc.gov/Applications/heatTracker/" target="_blank">CDC Heat and Health Index</a></li>
        </ul>

        <h3>Color Scheme</h3>
        <div class="scheme-options">
          <label class:active={$colorScheme === 'default'}>
            <input type="radio" bind:group={$colorScheme} value="default"> Default
          </label>
          <label class:active={$colorScheme === 'colorblind'}>
            <input type="radio" bind:group={$colorScheme} value="colorblind"> Colorblind
          </label>
          <label class:active={$colorScheme === 'complementary'}>
            <input type="radio" bind:group={$colorScheme} value="complementary"> Warm
          </label>
        </div>
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
  .info-panel {
    background: rgba(20, 20, 35, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    color: #e0e0e0;
    font-family: 'DM Sans', -apple-system, sans-serif;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .info-header h2 {
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
    transition: all 0.2s;
  }
  .close-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .info-body {
    padding: 16px 24px 24px;
    font-size: 14px;
    line-height: 1.6;
  }
  .info-body a {
    color: #ff6b35;
    text-decoration: none;
  }
  .info-body a:hover {
    text-decoration: underline;
  }
  .info-body h3 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    margin: 20px 0 8px;
  }
  .info-body ul {
    padding-left: 16px;
    margin: 0;
  }
  .info-body li {
    margin: 4px 0;
  }
  .scheme-options {
    display: flex;
    gap: 8px;
  }
  .scheme-options label {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  .scheme-options label.active {
    border-color: #ff6b35;
    background: rgba(255, 107, 53, 0.15);
  }
  .scheme-options input {
    display: none;
  }
</style>
