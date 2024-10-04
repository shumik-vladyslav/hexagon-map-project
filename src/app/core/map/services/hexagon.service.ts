import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as L from 'leaflet';
import { h3ToGeoBoundary, geoToH3 } from 'h3-js';
import { HexagonFeature } from '../models/hexagon-feature';

@Injectable()
export class HexagonService {
  private hexagons$ = new BehaviorSubject<HexagonFeature[]>([]);

  constructor(private http: HttpClient) {}

  loadHexagonData(): void {
    this.http
      .get<GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>>('assets/data.json')
      .pipe(map((data) => (data.features as HexagonFeature[])))
      .subscribe(hexagons => this.hexagons$.next(hexagons));
  }

  getHexagons(): Observable<HexagonFeature[]> {
    return this.hexagons$.asObservable();
  }

  filterVisibleHexagons(
    hexagons: HexagonFeature[],
    bounds: L.LatLngBounds | null
  ): HexagonFeature[] {
    if (!bounds) return [];
  
    return hexagons.map(hexagon => {
      const filteredCoordinates = hexagon.geometry.coordinates.map(polygon => 
        polygon.map(ring => 
          ring.filter(coord => {
            const latLng = this.convertTo4326(coord[0], coord[1]);
            return bounds.contains(latLng);
          })
        ).filter(ring => ring.length > 0)
      ).filter(polygon => polygon.length > 0);
  
      return {
        ...hexagon,
        geometry: {
          ...hexagon.geometry,
          coordinates: filteredCoordinates
        }
      };
    }).filter(hexagon => hexagon.geometry.coordinates.length > 0);
  }

  prepareHexagonData(hexagons: HexagonFeature[], zoom: number): { latLngBoundary: L.LatLngExpression[], polygonOptions: L.PolylineOptions }[] {
    const hexagonData: { latLngBoundary: L.LatLngExpression[], polygonOptions: L.PolylineOptions }[] = [];
    const processedH3Indexes = new Set<string>();

    hexagons.forEach((hexagon) => {
      if (hexagon.geometry.type !== 'MultiPolygon') return;
      const color = `#${hexagon.properties.COLOR_HEX}`;
      const polygonOptions: L.PolylineOptions = {
        color: color,
        fillColor: color,
        fillOpacity: 0.5,
        weight: 1,
      };

      hexagon.geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          const center = this.convertTo4326(ring[0][0], ring[0][1]);
          const h3Index = geoToH3(center.lat, center.lng, this.getResolutionForZoom(zoom));
          
          if (processedH3Indexes.has(h3Index)) return;
          processedH3Indexes.add(h3Index);

          const hexBoundary = h3ToGeoBoundary(h3Index);
          const latLngBoundary: L.LatLngExpression[] = hexBoundary.map(([lat, lng]) => [lat, lng]);
          hexagonData.push({ latLngBoundary, polygonOptions });
        });
      });
    });

    return hexagonData;
  }

  private convertTo4326(x: number, y: number): L.LatLng {
    return L.Projection.SphericalMercator.unproject(L.point(x, y));
  }

  private getResolutionForZoom(zoom: number): number {
    if (zoom < 3) return 2;
    if (zoom < 5) return 3;
    if (zoom < 7) return 4;
    if (zoom < 9) return 5;
    if (zoom < 11) return 6;
    return 7;
  }
}
