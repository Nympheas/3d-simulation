import styles from './styles.module.scss';
import { useContext, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import MapContext from 'contexts/Map';
import NavigationContext from 'contexts/Navigation';
import CameraContext from 'contexts/Camera';
import { ThreeJSOverlayView } from '@googlemaps/three';
import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  Scene,
  Vector3,
} from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

interface Props {
  className?: string;
}

const Viewport = ({ className }: Props) => {
  const { apiLoadError, isLoadingApi, mapId } = useContext(MapContext);
  const [hasNavData, getNavData] = useContext(NavigationContext);
  const getCameraState = useContext(CameraContext);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapElemRef = useRef(null);
  const frameIdRef = useRef(0);
  const overlayViewRef = useRef<ThreeJSOverlayView | null>(null);

  useEffect(() => {
    if (isLoadingApi || !hasNavData || apiLoadError || !mapId) {
      return;
    }
    const { lat, lng } = getNavData();
    const { heading, tilt, zoom } = getCameraState();
    let map = new google.maps.Map(mapElemRef.current!, {
      center: { lat, lng },
      disableDefaultUI: true,
      gestureHandling: 'none',
      keyboardShortcuts: false,
      mapId,
      heading,
      tilt,
      zoom,
    });
    setMap(map);
  }, [
    isLoadingApi,
    hasNavData,
    mapId,
    apiLoadError,
    getCameraState,
    getNavData,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const scene = new Scene();
    const droneMaterial = new MeshPhongMaterial();
    droneMaterial.color.set(0xff0000);
    const droneGeometry = new ConvexGeometry([
      new Vector3(5, 0, -5),
      new Vector3(5, 0, 5),
      new Vector3(-5, 0, 5),
      new Vector3(-5, 0, -5),
      new Vector3(0, 3, 0),
      new Vector3(0, -3, 0),
    ]);
    const drone = new Mesh(droneGeometry, droneMaterial);
    drone.castShadow = true;
    drone.receiveShadow = true;
    const ambientLight = new AmbientLight(0xffffff, 0.25);
    const directionalLight = new DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(5e6, 1e7, 5e6);
    scene.add(ambientLight);
    scene.add(directionalLight);
    scene.add(drone);
    const { lat, lng } = getNavData();
    overlayViewRef.current = new ThreeJSOverlayView({
      anchor: { altitude: 0, lat, lng },
      map,
      scene,
    });
    const onFrame = () => {
      const { heading, tilt, zoom } = getCameraState();
      const { alt, hdg, lat, lng } = getNavData();
      let overlayView = overlayViewRef.current!;
      overlayView.anchor.lat = lat;
      overlayView.anchor.lng = lng;
      drone.position.setY(alt);
      drone.rotation.set(0, hdg, 0);
      map.moveCamera({ center: { lat, lng }, heading, tilt, zoom });
      frameIdRef.current = requestAnimationFrame(onFrame);
    };
    frameIdRef.current = requestAnimationFrame(onFrame);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      overlayViewRef.current = null;
    };
  }, [map, getCameraState, getNavData]);

  return (
    <div className={cn(styles.container, className)}>
      {isLoadingApi || !hasNavData ? (
        <div className={styles.loadingIndicator}>Loading...</div>
      ) : apiLoadError ? (
        <div className={styles.error}>{apiLoadError}</div>
      ) : (
        <div className={styles.map} ref={mapElemRef} />
      )}
    </div>
  );
};

export default Viewport;
