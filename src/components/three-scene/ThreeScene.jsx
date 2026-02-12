import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ThreeScene.css'

function ThreeScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mountNode = mountRef.current
    if (!mountNode) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      mountNode.clientWidth / mountNode.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 0, 3.2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountNode.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xff3355, 0.7)
    const keyLight = new THREE.DirectionalLight(0xffe86f, 1.1)
    keyLight.position.set(2, 3, 4)
    const rimLight = new THREE.PointLight(0x7c1bff, 0.6, 10)
    rimLight.position.set(-2, 1.5, 2.5)
    scene.add(ambientLight, keyLight, rimLight)

    const geometry = new THREE.TorusKnotGeometry(0.7, 0.24, 120, 14)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0xff0037) },
        uColorB: { value: new THREE.Color(0x1b0010) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;

        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          float n = noise(vUv * 8.0 + uTime * 0.1);
          float stripes = smoothstep(0.4, 0.6, sin((vUv.y + uTime * 0.2) * 18.0));
          float mixVal = clamp(n * 0.6 + stripes * 0.5, 0.0, 1.0);
          vec3 color = mix(uColorB, uColorA, mixVal);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
    const knot = new THREE.Mesh(geometry, material)
    knot.position.set(0, 0, 0)
    scene.add(knot)

    const sparkGeometry = new THREE.IcosahedronGeometry(0.08, 0)
    const sparkMaterial = new THREE.MeshToonMaterial({
      color: 0xff0037,
      emissive: 0xff0037,
      emissiveIntensity: 1,
    })

    const sparks = Array.from({ length: 18 }, (_, index) => {
      const spark = new THREE.Mesh(sparkGeometry, sparkMaterial)
      const angle = (index / 18) * Math.PI * 2
      spark.position.set(Math.cos(angle) * 1.6, Math.sin(angle) * 0.6, -0.6)
      scene.add(spark)
      return spark
    })

    let animationFrame

    const clock = new THREE.Clock()

    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime()
      knot.rotation.x += 0.003
      knot.rotation.y += 0.004

      sparks.forEach((spark, index) => {
        spark.position.y = Math.sin(Date.now() * 0.002 + index) * 0.6
        spark.rotation.x += 0.01
        spark.rotation.y += 0.008
      })

      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      const { clientWidth, clientHeight } = mountRef.current
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      camera.lookAt(0, 0, 0)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(mountNode)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrame)
      geometry.dispose()
      material.dispose()
      sparkGeometry.dispose()
      sparkMaterial.dispose()
      renderer.dispose()
      mountNode.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="three-scene" ref={mountRef} />
}

export default ThreeScene
