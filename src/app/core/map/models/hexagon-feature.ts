export interface HexagonFeature extends GeoJSON.Feature<GeoJSON.MultiPolygon> {
    properties: {
      COLOR_HEX: string;
      ID: number;
    };
  }