export const colorSchemes = {
  default: [
    [181, 209, 142], // 0 - Green
    [255, 242, 140], // 1 - Yellow
    [255, 167, 73],  // 2 - Orange
    [255, 87, 87],   // 3 - Red
    [163, 73, 164]   // 4 - Magenta
  ],
  colorblind: [
    [213, 94, 0],
    [204, 121, 167],
    [0, 114, 178],
    [240, 228, 66],
    [0, 158, 115]
  ],
  complementary: [
    [255, 255, 204],
    [255, 217, 102],
    [255, 153, 51],
    [255, 102, 0],
    [204, 51, 0]
  ]
};

export const riskLabels = [
  { level: 0, label: 'Little/None', color: '#b5d18e' },
  { level: 1, label: 'Minor', color: '#fff28c' },
  { level: 2, label: 'Moderate', color: '#ffa749' },
  { level: 3, label: 'Major', color: '#ff5757' },
  { level: 4, label: 'Extreme', color: '#a349a4' }
];

export function getFillColor(feature, scheme = 'default') {
  const riskLevel = feature.properties.raster_value;
  const colors = colorSchemes[scheme] || colorSchemes.default;
  return colors[riskLevel] || colors[colors.length - 1];
}
