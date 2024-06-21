// src/global.d.ts
declare module "three/examples/jsm/controls/PointerLockControls" {
  import { Camera, EventDispatcher, Vector3, Object3D } from "three";

  export class PointerLockControls extends EventDispatcher {
    constructor(camera: Camera, domElement: HTMLElement);
    domElement: HTMLElement;
    isLocked: boolean;
    minPolarAngle: number;
    maxPolarAngle: number;
    pointerSpeed: number;
    connect(): void;
    disconnect(): void;
    dispose(): void;
    getObject(): Object3D; // Corrected type declaration
    getDirection(v: Vector3): Vector3;
    moveForward(distance: number): void;
    moveRight(distance: number): void;
    lock(): void;
    unlock(): void;
  }
}
