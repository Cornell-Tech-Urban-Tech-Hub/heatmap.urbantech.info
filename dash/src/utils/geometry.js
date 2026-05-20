export function extractGeometryFromWKB(geometryData) {
  if (!geometryData || !(geometryData instanceof Uint8Array)) return null;

  try {
    const dataView = new DataView(geometryData.buffer, geometryData.byteOffset, geometryData.byteLength);
    const byteOrder = dataView.getUint8(0);
    const littleEndian = byteOrder === 1;
    const wkbType = dataView.getUint32(1, littleEndian);

    switch (wkbType) {
      case 3: return parsePolygon(dataView, littleEndian);
      case 6: return parseMultiPolygon(dataView, littleEndian);
      default: return null;
    }
  } catch {
    return null;
  }
}

function parsePolygon(dataView, littleEndian) {
  const numRings = dataView.getUint32(5, littleEndian);
  let offset = 9;
  const coordinates = [];

  for (let i = 0; i < numRings; i++) {
    const numPoints = dataView.getUint32(offset, littleEndian);
    offset += 4;
    const ring = [];
    for (let j = 0; j < numPoints; j++) {
      ring.push([
        dataView.getFloat64(offset, littleEndian),
        dataView.getFloat64(offset + 8, littleEndian)
      ]);
      offset += 16;
    }
    coordinates.push(ring);
  }
  return { type: 'Polygon', coordinates };
}

function parseMultiPolygon(dataView, littleEndian) {
  const numPolygons = dataView.getUint32(5, littleEndian);
  let offset = 9;
  const coordinates = [];

  for (let i = 0; i < numPolygons; i++) {
    const byteOrder = dataView.getUint8(offset);
    offset += 1;
    const polyLE = byteOrder === 1;
    const polyType = dataView.getUint32(offset, polyLE) & 0xFF;
    offset += 4;

    if (polyType !== 3) continue;

    const numRings = dataView.getUint32(offset, polyLE);
    offset += 4;
    const polygon = [];

    for (let j = 0; j < numRings; j++) {
      const numPoints = dataView.getUint32(offset, polyLE);
      offset += 4;
      const ring = [];
      for (let k = 0; k < numPoints; k++) {
        ring.push([
          dataView.getFloat64(offset, polyLE),
          dataView.getFloat64(offset + 8, polyLE)
        ]);
        offset += 16;
      }
      polygon.push(ring);
    }
    coordinates.push(polygon);
  }
  return { type: 'MultiPolygon', coordinates };
}

export function computeBounds(geometry) {
  let coords = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates.flat();
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(p => coords.push(...p.flat()));
  }
  if (!coords.length) return null;

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}
