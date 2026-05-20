import { tableFromIPC } from 'apache-arrow';
import { extractGeometryFromWKB } from './geometry.js';

let parquetInit = null;

async function initParquet() {
  if (!parquetInit) {
    const wasm = await import('parquet-wasm/esm/parquet_wasm.js');
    await wasm.default();
    parquetInit = wasm;
  }
  return parquetInit;
}

export async function fetchGeoParquet(url) {
  const wasm = await initParquet();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);

  const arrayBuffer = await response.arrayBuffer();
  const parquetBytes = new Uint8Array(arrayBuffer);
  const wasmTable = wasm.readParquet(parquetBytes);
  const ipcStream = wasmTable.intoIPCStream();
  const table = tableFromIPC(ipcStream);

  return convertArrowToGeoJSON(table);
}

export async function fetchGeoParquetWithFallback(primaryUrl, fallbackUrl) {
  try {
    return await fetchGeoParquet(primaryUrl);
  } catch {
    return await fetchGeoParquet(fallbackUrl);
  }
}

function convertArrowToGeoJSON(table) {
  const features = [];
  const geomField = table.schema.fields.find(f => f.name === 'geometry');
  if (!geomField) return { type: 'FeatureCollection', features };

  for (let i = 0; i < table.numRows; i++) {
    const properties = {};
    for (const field of table.schema.fields) {
      if (field.name !== 'geometry') {
        const col = table.getChild(field.name);
        properties[field.name] = col ? col.get(i) : null;
      }
    }

    const geomCol = table.getChild('geometry');
    const geomData = geomCol ? geomCol.get(i) : null;
    const geometry = extractGeometryFromWKB(geomData);

    if (geometry) {
      features.push({ type: 'Feature', properties, geometry });
    }
  }
  return { type: 'FeatureCollection', features };
}
