
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js geometry elements
      bufferGeometry: any
      bufferAttribute: any
      geometry: any
      sphereGeometry: any
      planeGeometry: any
      boxGeometry: any
      cylinderGeometry: any
      coneGeometry: any
      torusGeometry: any
      ringGeometry: any
      
      // Three.js material elements
      material: any
      meshBasicMaterial: any
      meshStandardMaterial: any
      meshPhongMaterial: any
      meshLambertMaterial: any
      lineBasicMaterial: any
      pointsMaterial: any
      shaderMaterial: any
      
      // Three.js mesh elements
      mesh: any
      line: any
      points: any
      group: any
      
      // Three.js light elements
      ambientLight: any
      directionalLight: any
      pointLight: any
      spotLight: any
      hemisphereLight: any
      
      // Three.js camera elements
      perspectiveCamera: any
      orthographicCamera: any
      
      // Three.js control elements
      orbitControls: any
      
      // Three.js helper elements
      axesHelper: any
      gridHelper: any
      arrowHelper: any
      
      // Three.js primitive elements
      primitive: any
    }
  }
}

export { }
