// @types/three is still r185. These two declarations mirror the installed r186 APIs.
// Remove this file once DefinitelyTyped publishes the native splat addon declarations.
declare module "three/addons/objects/GaussianSplat.js" {
  import { BufferGeometry, Mesh, NodeMaterial } from "three/webgpu";
  export class GaussianSplat extends Mesh<BufferGeometry, NodeMaterial> {
    constructor(geometry: BufferGeometry, options?: { autoSort?: boolean });
    readonly isGaussianSplat: true;
    splatGeometry: BufferGeometry;
  }
}
declare module "three/addons/loaders/SPZLoader.js" {
  import { BufferGeometry, Loader } from "three";
  export class SPZLoader extends Loader<BufferGeometry> {
    parse(buffer: ArrayBuffer): BufferGeometry | Promise<BufferGeometry>;
  }
}
