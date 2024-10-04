import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable()
export class MapService {
  private map!: L.Map;
  private hexagonLayer!: L.LayerGroup;

  initializeMap(elementId: string): void {
    this.map = L.map(elementId, {
      renderer: L.canvas()
    }).setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.hexagonLayer = L.layerGroup().addTo(this.map);
  }

  getMap(): L.Map {
    return this.map;
  }

  clearHexagonLayer(): void {
    this.hexagonLayer.clearLayers();
  }

  addHexagonToLayer(latLngBoundary: L.LatLngExpression[], polygonOptions: L.PolylineOptions): void {
    L.polygon(latLngBoundary, polygonOptions).addTo(this.hexagonLayer);
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
