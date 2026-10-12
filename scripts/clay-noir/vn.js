// Vietnam as extruded clay, shared by the map and the FDI cover.
import * as THREE from "three";
import geo from "../vn-map/vnm.json";

export const HOANG_SA = [[112.34, 16.83], [111.61, 16.53], [111.2, 15.78], [112.73, 16.67], [111.51, 16.45], [112.53, 16.05], [111.75, 16.45], [112.26, 16.97], [112.57, 16.58], [111.7, 16.58]];
export const TRUONG_SA = [[111.92, 8.64], [114.33, 11.43], [114.36, 10.18], [114.33, 9.88], [114.48, 10.38], [114.28, 11.05], [112.92, 7.89], [114.36, 10.38], [112.2, 8.85], [113.3, 8.1], [115.83, 10.72], [116.27, 9.92], [115.53, 8.85], [113.85, 8.85], [114.7, 9.7], [112.9, 9.3], [116.7, 11.1], [114.0, 10.7]];

/** Projection to the table plane: x east, z south, one unit per degree of latitude. */
export function projector(lon0, lat0, k = Math.cos((15 * Math.PI) / 180)) {
  return { X: (lon) => (lon - lon0) * k, Z: (lat) => -(lat - lat0) };
}

export function vietnam({ X, Z }, materials, depth = 0.32) {
  const group = new THREE.Group();
  for (const poly of geo.coordinates) {
    const [outer, ...holes] = poly;
    const shape = new THREE.Shape(outer.map(([lon, lat]) => new THREE.Vector2(X(lon), -Z(lat))));
    for (const h of holes) shape.holes.push(new THREE.Path(h.map(([lon, lat]) => new THREE.Vector2(X(lon), -Z(lat)))));
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 5, curveSegments: 4 });
    const m = new THREE.Mesh(g, materials);
    m.rotation.x = -Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}
