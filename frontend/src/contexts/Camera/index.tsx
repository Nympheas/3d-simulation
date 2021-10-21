import { createContext, useEffect } from 'react';

// Used for computing scale value to try and preserve objects perceived size
// regardless of zoom. This scale value is currently not used.
// See https://github.com/googlemaps/js-three/issues/110#issuecomment-929457818
const zoomScale = [
  1183315101, 591657550.5, 295828775.3, 147914387.6, 73957193.82, 36978596.91,
  18489298.45, 9244649.227, 4622324.614, 2311162.307, 1155581.153, 577790.5767,
  288895.2884, 144447.6442, 72223.82209, 36111.91104, 18055.95552, 9027.977761,
  4513.98888, 2256.99444, 1128.49722,
];

const SCALE_FACTOR = 1 / 1e4;

const state = {
  heading: 0,
  scale: zoomScale[15] * SCALE_FACTOR,
  tilt: 45,
  zoom: 17,
};
let isModKeyDown = false;
const MOD_KEY = 'Shift';
const mouseCoords = [0, 0];
const modDownCoords = [0, 0];
const modDownState = {
  heading: 0,
  tilt: 0,
  zoom: 0,
};

const getState = () => state;

function onKeyDown(event: KeyboardEvent) {
  if (event.key === MOD_KEY) {
    isModKeyDown = true;
    modDownCoords[0] = mouseCoords[0];
    modDownCoords[1] = mouseCoords[1];
    modDownState.heading = state.heading;
    modDownState.tilt = state.tilt;
    modDownState.zoom = state.zoom;
  }
}

function onKeyUp(event: KeyboardEvent) {
  if (event.key === MOD_KEY) {
    isModKeyDown = false;
  }
}

function onMouseMove(event: MouseEvent) {
  mouseCoords[0] = event.screenX;
  mouseCoords[1] = event.screenY;
  if (isModKeyDown) {
    let dx = mouseCoords[0] - modDownCoords[0];
    dx /= 10;
    let dy = modDownCoords[1] - mouseCoords[1];
    dy /= 10;
    state.tilt = Math.min(Math.max(modDownState.tilt + dy, 0), 90);
    state.heading = (modDownState.heading + dx) % 360;
  }
}

function onMouseWheel(event: WheelEvent) {
  if (!isModKeyDown) {
    return;
  }
  let zoom = state.zoom - Math.sign(event.deltaY) / 5;
  zoom = Math.min(Math.max(zoom, 5), 20);
  state.zoom = zoom;
  let zoomUpper = Math.ceil(zoom);
  let zoomLower = Math.floor(zoom);
  if (zoomUpper === zoomLower) {
    state.scale = zoomScale[zoomUpper] * SCALE_FACTOR;
  } else {
    let scaleUpper = zoomScale[zoomUpper];
    let scaleLower = zoomScale[zoomLower];
    state.scale =
      ((scaleUpper - scaleLower) * (zoom - zoomLower) + scaleLower) *
      SCALE_FACTOR;
  }
}

const CameraContext = createContext(getState);

export default CameraContext;

interface Props {
  children: any;
}

/**
 * Provides the context with camera state.
 *
 * @param props component properties
 */
export const Provider = ({ children }: Props) => {
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('wheel', onMouseWheel, false);
    window.addEventListener('mousemove', onMouseMove, false);

    return () => {
      window.removeEventListener('mousemove', onMouseMove, false);
      window.removeEventListener('wheel', onMouseWheel, false);
      document.removeEventListener('keyup', onKeyUp, false);
      document.removeEventListener('keydown', onKeyDown, false);
    };
  }, []);

  return <CameraContext.Provider children={children} value={getState} />;
};
