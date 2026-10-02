/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WeatherType, TimeOfDayPhase } from '../types';
import { GRID_SIZE } from '../constants';

interface WeatherAndLightingProps {
  time: number; // 0 to 24
  phase: TimeOfDayPhase;
  weather: WeatherType;
}

// Global material for window glow that buildings can reference or we can modulate
export const windowMaterial = new THREE.MeshStandardMaterial({
  color: '#bfdbfe',
  emissive: '#bfdbfe',
  emissiveIntensity: 0.15,
  roughness: 0.2,
  metalness: 0.8,
});

// Streetlight glowing bulb material
export const streetlampGlowMat = new THREE.MeshStandardMaterial({
  color: '#fef08a',
  emissive: '#fef08a',
  emissiveIntensity: 0.0,
  roughness: 0.2,
});

// Helper for smooth cyclical interpolation between colors
const lerpColor = (c1: string, c2: string, alpha: number) => {
  return new THREE.Color(c1).lerp(new THREE.Color(c2), THREE.MathUtils.clamp(alpha, 0, 1));
};

export const WeatherAndLighting: React.FC<WeatherAndLightingProps> = ({ time, phase, weather }) => {
  const { scene } = useThree();

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);

  // Lightning state for storms
  const lightningRef = useRef<{ active: boolean; timer: number; nextFlash: number }>({
    active: false,
    timer: 0,
    nextFlash: 5 + Math.random() * 6,
  });

  // 1. Calculate Sun / Moon / Sky / Light properties based on time and weather
  const { skyColor, sunColor, sunIntensity, sunPos, ambColor, ambIntensity, fogDist, isNight } = useMemo(() => {
    // Normal day cycle:
    // 5-7: Dawn
    // 7-17: Day
    // 17-20: Dusk
    // 20-5: Night

    let sColor = new THREE.Color('#38bdf8'); // Sky
    let dirColor = new THREE.Color('#fffbeb'); // Sun
    let dirInt = 2.0;
    let aColor = new THREE.Color('#e0f2fe'); // Ambient
    let aInt = 0.6;
    let fogNear = 40;
    let fogFar = 100;
    let night = false;

    // Sun / Moon trajectory
    let pos: [number, number, number] = [15, 22, 10];

    if (time >= 5 && time < 7.5) {
      // DAWN
      const t = (time - 5) / 2.5;
      sColor = lerpColor('#1e1b4b', '#38bdf8', t);
      sColor.lerp(new THREE.Color('#fb7185'), Math.sin(t * Math.PI) * 0.6);
      dirColor = lerpColor('#f97316', '#fffbeb', t);
      dirInt = THREE.MathUtils.lerp(0.8, 2.0, t);
      aColor = lerpColor('#312e81', '#e0f2fe', t);
      aInt = THREE.MathUtils.lerp(0.35, 0.6, t);

      const angle = (t * 0.5) * Math.PI;
      pos = [25 * Math.cos(angle), 18 * Math.sin(angle) + 2, 10];
    } else if (time >= 7.5 && time < 17) {
      // DAY
      const t = (time - 7.5) / 9.5;
      sColor = new THREE.Color('#0284c7');
      dirColor = new THREE.Color('#fffbeb');
      dirInt = 2.2;
      aColor = new THREE.Color('#e0f2fe');
      aInt = 0.65;

      const angle = (0.25 + t * 0.5) * Math.PI;
      pos = [25 * Math.cos(angle), Math.max(8, 26 * Math.sin(angle)), 10];
    } else if (time >= 17 && time < 20) {
      // DUSK
      const t = (time - 17) / 3;
      sColor = lerpColor('#0284c7', '#020617', t);
      sColor.lerp(new THREE.Color('#ea580c'), Math.sin(t * Math.PI) * 0.7);
      dirColor = lerpColor('#fffbeb', '#f97316', t);
      dirInt = THREE.MathUtils.lerp(2.0, 0.6, t);
      aColor = lerpColor('#e0f2fe', '#1e1b4b', t);
      aColor.lerp(new THREE.Color('#fdba74'), Math.sin(t * Math.PI) * 0.4);
      aInt = THREE.MathUtils.lerp(0.6, 0.28, t);

      const angle = (0.75 + t * 0.25) * Math.PI;
      pos = [25 * Math.cos(angle), Math.max(1, 20 * Math.sin(angle)), 10];
    } else {
      // NIGHT
      night = true;
      sColor = new THREE.Color('#020617');
      dirColor = new THREE.Color('#93c5fd'); // Cool silver-blue moonlight
      dirInt = 0.45;
      aColor = new THREE.Color('#0f172a');
      aInt = 0.22;
      fogNear = 30;
      fogFar = 75;

      // Moon position from opposite side
      const nightProgress = time >= 20 ? (time - 20) / 9 : (time + 4) / 9;
      const angle = (0.2 + nightProgress * 0.6) * Math.PI;
      pos = [-20 * Math.cos(angle), 18 * Math.sin(angle), -8];
    }

    // Weather modulations
    if (weather === 'rain') {
      sColor.lerp(new THREE.Color('#334155'), 0.65);
      dirColor.lerp(new THREE.Color('#94a3b8'), 0.5);
      dirInt *= 0.55;
      aColor.lerp(new THREE.Color('#475569'), 0.5);
      aInt *= 0.75;
      fogNear = 22;
      fogFar = 55;
    } else if (weather === 'storm') {
      sColor.lerp(new THREE.Color('#0f172a'), 0.85);
      dirColor.lerp(new THREE.Color('#475569'), 0.7);
      dirInt *= 0.35;
      aColor.lerp(new THREE.Color('#1e293b'), 0.7);
      aInt *= 0.6;
      fogNear = 18;
      fogFar = 48;
    } else if (weather === 'fog') {
      sColor.lerp(new THREE.Color('#64748b'), 0.8);
      dirColor.lerp(new THREE.Color('#cbd5e1'), 0.7);
      dirInt *= 0.45;
      aColor.lerp(new THREE.Color('#94a3b8'), 0.7);
      aInt *= 0.8;
      fogNear = 10;
      fogFar = 32;
    } else if (weather === 'snow') {
      sColor.lerp(new THREE.Color('#475569'), 0.5);
      dirColor.lerp(new THREE.Color('#f8fafc'), 0.4);
      dirInt *= 0.7;
      aColor.lerp(new THREE.Color('#cbd5e1'), 0.6);
      aInt = Math.max(aInt, 0.45);
      fogNear = 25;
      fogFar = 65;
    }

    return {
      skyColor: sColor,
      sunColor: dirColor,
      sunIntensity: dirInt,
      sunPos: pos,
      ambColor: aColor,
      ambIntensity: aInt,
      fogDist: [fogNear, fogFar] as [number, number],
      isNight: night,
    };
  }, [time, weather]);

  // Modulate window glow and streetlights based on night/dusk
  useEffect(() => {
    if (isNight || phase === 'dusk') {
      // Golden glowing indoor lights
      windowMaterial.color.set('#fef08a');
      windowMaterial.emissive.set('#fef08a');
      windowMaterial.emissiveIntensity = isNight ? 1.6 : 0.8;
      streetlampGlowMat.emissiveIntensity = isNight ? 2.5 : 1.2;
    } else {
      // Daytime tinted windows
      windowMaterial.color.set('#bfdbfe');
      windowMaterial.emissive.set('#bfdbfe');
      windowMaterial.emissiveIntensity = 0.15;
      streetlampGlowMat.emissiveIntensity = 0.0;
    }
  }, [isNight, phase]);

  // Frame animation for lightning flashes in storms
  useFrame((_, delta) => {
    if (weather === 'storm' && dirLightRef.current && ambLightRef.current) {
      lightningRef.current.timer += delta;
      if (lightningRef.current.timer >= lightningRef.current.nextFlash) {
        // Trigger lightning flash
        lightningRef.current.active = true;
        lightningRef.current.timer = 0;
        lightningRef.current.nextFlash = 6 + Math.random() * 10;
      }

      if (lightningRef.current.active) {
        if (lightningRef.current.timer < 0.1) {
          // Sharp bright flash
          dirLightRef.current.intensity = 4.5;
          dirLightRef.current.color.set('#e0f2fe');
          ambLightRef.current.intensity = 2.0;
          ambLightRef.current.color.set('#ffffff');
        } else if (lightningRef.current.timer < 0.18) {
          // Quick secondary flicker
          dirLightRef.current.intensity = 2.8;
          ambLightRef.current.intensity = 1.2;
        } else {
          // Flash over
          lightningRef.current.active = false;
        }
      }
    }
  });

  return (
    <>
      {/* Sky Background & Atmospheric Fog */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogDist[0], fogDist[1]]} />

      {/* Main Celestial Directional Light (Sun / Moon) */}
      <directionalLight
        ref={dirLightRef}
        castShadow
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />

      {/* Ambient Lighting */}
      <ambientLight ref={ambLightRef} intensity={ambIntensity} color={ambColor} />

      {/* Night Celestial Stars */}
      <Starfield isNight={isNight} phase={phase} />

      {/* Precipitation / Weather Particles */}
      {(weather === 'rain' || weather === 'storm') && (
        <RainParticles isStorm={weather === 'storm'} />
      )}

      {weather === 'snow' && <SnowParticles />}

      {weather === 'fog' && <FogMistLayer />}
    </>
  );
};

// --- Starfield Component ---
const Starfield = React.memo(({ isNight, phase }: { isNight: boolean; phase: TimeOfDayPhase }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 350;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Scatter in high dome above island
      pos[i * 3 + 0] = (Math.random() - 0.5) * (GRID_SIZE * 5);
      pos[i * 3 + 1] = 18 + Math.random() * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (GRID_SIZE * 5);
    }
    return [pos];
  }, []);

  const opacity = isNight ? 0.9 : phase === 'dusk' || phase === 'dawn' ? 0.35 : 0;

  useFrame((state) => {
    if (pointsRef.current && opacity > 0) {
      // Gentle twinkle
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = opacity * (0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2);
    }
  });

  if (opacity <= 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.3} color="#f8fafc" transparent opacity={opacity} sizeAttenuation />
    </points>
  );
});

// --- Rain Particle System ---
const RainParticles = React.memo(({ isStorm }: { isStorm: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const dropCount = isStorm ? 1600 : 900;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(dropCount * 3);
    const spd = new Float32Array(dropCount);
    for (let i = 0; i < dropCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      pos[i * 3 + 1] = Math.random() * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      spd[i] = (isStorm ? 24 : 16) + Math.random() * 8;
    }
    return [pos, spd];
  }, [dropCount, isStorm]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    const windSlant = isStorm ? 0.22 : 0.08;

    for (let i = 0; i < dropCount; i++) {
      arr[i * 3 + 1] -= speeds[i] * delta;
      arr[i * 3 + 0] += windSlant * speeds[i] * delta;

      // Reset when hitting ground
      if (arr[i * 3 + 1] < -0.4) {
        arr[i * 3 + 1] = 16 + Math.random() * 3;
        arr[i * 3 + 0] = (Math.random() - 0.5) * (GRID_SIZE * 3);
        arr[i * 3 + 2] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={isStorm ? 0.22 : 0.16}
        color={isStorm ? '#93c5fd' : '#bfdbfe'}
        transparent
        opacity={isStorm ? 0.75 : 0.6}
        sizeAttenuation
      />
    </points>
  );
});

// --- Snow Particle System ---
const SnowParticles = React.memo(() => {
  const pointsRef = useRef<THREE.Points>(null);
  const flakeCount = 750;

  const [positions, params] = useMemo(() => {
    const pos = new Float32Array(flakeCount * 3);
    const p = new Float32Array(flakeCount * 2); // speed, swayOffset
    for (let i = 0; i < flakeCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      pos[i * 3 + 1] = Math.random() * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      p[i * 2 + 0] = 1.8 + Math.random() * 2.2; // Fall speed
      p[i * 2 + 1] = Math.random() * Math.PI * 2; // Sway phase
    }
    return [pos, p];
  }, [flakeCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < flakeCount; i++) {
      const spd = params[i * 2 + 0];
      const swayOffset = params[i * 2 + 1];

      arr[i * 3 + 1] -= spd * delta;
      arr[i * 3 + 0] += Math.sin(time * 1.5 + swayOffset) * 0.012;
      arr[i * 3 + 2] += Math.cos(time * 1.2 + swayOffset) * 0.008;

      if (arr[i * 3 + 1] < -0.3) {
        arr[i * 3 + 1] = 16 + Math.random() * 2;
        arr[i * 3 + 0] = (Math.random() - 0.5) * (GRID_SIZE * 3);
        arr[i * 3 + 2] = (Math.random() - 0.5) * (GRID_SIZE * 3);
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        color="#ffffff"
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
});

// --- Fog Mist Layer ---
const FogMistLayer = React.memo(() => {
  const mistRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (mistRef.current) {
      mistRef.current.position.x += 0.25 * delta;
      if (mistRef.current.position.x > GRID_SIZE) {
        mistRef.current.position.x = -GRID_SIZE;
      }
    }
  });

  return (
    <group ref={mistRef} position={[0, 0.4, 0]}>
      {[-8, 0, 8].map((offset, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.1 * i, offset * 0.5]}>
          <planeGeometry args={[GRID_SIZE * 2, GRID_SIZE * 2]} />
          <meshStandardMaterial
            color="#cbd5e1"
            transparent
            opacity={0.35}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});
