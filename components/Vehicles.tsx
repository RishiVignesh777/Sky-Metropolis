/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Grid, BuildingType } from '../types';
import { GRID_SIZE } from '../constants';

// --- Shared Geometries ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
const wheelTireGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.034, 12);
const wheelRimGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.036, 10);

// --- Shared Standard Materials ---
const tireMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9, metalness: 0.1 });
const rimSilverMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.8 });
const rimDarkMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.6 });
const rimGoldMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3, metalness: 0.8 });

const windowMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.9, opacity: 0.9, transparent: true });
const busWindowMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.15, metalness: 0.85, opacity: 0.92, transparent: true });

const headlightMat = new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fffbeb', emissiveIntensity: 1.5, roughness: 0.1 });
const taillightMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.4, roughness: 0.1 });

const darkTrimMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.2 });
const chromeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.15, metalness: 0.95 });

const taxiSignMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 1.2, roughness: 0.2 });
const busSignMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 1.4, roughness: 0.2 });
const woodCrateMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.9, metalness: 0.05 });
const cargoBoxMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6, metalness: 0.1 });

// Helper to calculate world coordinates
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

export type VehicleType = 
  | 'sedan' 
  | 'sports' 
  | 'taxi' 
  | 'bus' 
  | 'delivery' 
  | 'pickup' 
  | 'suv' 
  | 'police';

const VEHICLE_TYPES: VehicleType[] = [
  'sedan', 
  'sports', 
  'taxi', 
  'bus', 
  'delivery', 
  'pickup', 
  'suv', 
  'police'
];

// Realistic color palettes per vehicle type
const SEDAN_COLORS = ['#dc2626', '#2563eb', '#059669', '#475569', '#1e293b', '#f8fafc', '#7c3aed'];
const SPORTS_COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#84cc16', '#ea580c', '#3b82f6'];
const BUS_COLORS = ['#0284c7', '#0d9488', '#16a34a', '#d97706', '#7c3aed'];
const DELIVERY_COLORS = ['#f8fafc', '#d97706', '#2563eb', '#78350f'];
const PICKUP_COLORS = ['#b91c1c', '#1d4ed8', '#15803d', '#334155', '#c2410c'];
const SUV_COLORS = ['#334155', '#1e3a8a', '#166534', '#78350f', '#0f172a', '#e2e8f0'];

// Reusable Wheel component
const Wheel = React.memo(({ position, rim = rimSilverMat }: { position: [number, number, number]; rim?: THREE.Material }) => (
  <group position={position}>
    <mesh geometry={wheelTireGeo} material={tireMat} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <mesh geometry={wheelRimGeo} material={rim} />
    </mesh>
  </group>
));

const policeSirenRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.0 });
const policeSirenBlueMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 2.0 });

// --- 1. Sedan Model ---
const SedanModel = React.memo(({ color }: { color: string }) => {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }), [color]);

  return (
    <group>
      {/* Lower chassis / rockers */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.045, 0]} scale={[0.48, 0.03, 0.23]} castShadow />
      
      {/* Hood */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.13, 0.075, 0]} scale={[0.16, 0.05, 0.22]} castShadow />
      
      {/* Trunk */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.145, 0.075, 0]} scale={[0.13, 0.05, 0.22]} castShadow />
      
      {/* Front Grille */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0.236, 0.065, 0]} scale={[0.015, 0.03, 0.14]} />
      
      {/* Cabin Body */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.01, 0.12, 0]} scale={[0.20, 0.065, 0.19]} castShadow />
      
      {/* Windshield (Front) */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.088, 0.115, 0]} rotation={[0, 0, -Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      
      {/* Rear Window */}
      <mesh geometry={boxGeo} material={windowMat} position={[-0.108, 0.115, 0]} rotation={[0, 0, Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      
      {/* Side Windows */}
      <mesh geometry={boxGeo} material={windowMat} position={[-0.01, 0.122, 0]} scale={[0.17, 0.045, 0.196]} />
      
      {/* Side Mirrors */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.08, 0.095, 0.11]} scale={[0.02, 0.02, 0.02]} />
      <mesh geometry={boxGeo} material={bodyMat} position={[0.08, 0.095, -0.11]} scale={[0.02, 0.02, 0.02]} />
      
      {/* Headlights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      
      {/* Taillights */}
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      
      {/* Wheels */}
      <Wheel position={[0.13, 0.044, 0.115]} />
      <Wheel position={[0.13, 0.044, -0.115]} />
      <Wheel position={[-0.13, 0.044, 0.115]} />
      <Wheel position={[-0.13, 0.044, -0.115]} />
    </group>
  );
});

// --- 2. Sports Car Model ---
const SportsCarModel = React.memo(({ color }: { color: string }) => {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.6 }), [color]);

  return (
    <group>
      {/* Low-profile chassis */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.035, 0]} scale={[0.49, 0.025, 0.25]} castShadow />
      
      {/* Aerodynamic front wedge hood */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.125, 0.06, 0]} scale={[0.19, 0.04, 0.24]} castShadow />
      
      {/* Carbon front splitter */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0.244, 0.028, 0]} scale={[0.03, 0.012, 0.25]} />
      
      {/* Cockpit Canopy */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.02, 0.09, 0]} scale={[0.18, 0.05, 0.17]} castShadow />
      
      {/* Slanted windshield */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.075, 0.088, 0]} rotation={[0, 0, -Math.PI / 5]} scale={[0.015, 0.055, 0.165]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.02, 0.092, 0]} scale={[0.14, 0.04, 0.176]} />
      
      {/* Rear engine deck */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.155, 0.062, 0]} scale={[0.13, 0.04, 0.24]} castShadow />
      
      {/* GT Rear Spoiler Wing */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.19, 0.088, 0.07]} scale={[0.015, 0.035, 0.015]} />
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.19, 0.088, -0.07]} scale={[0.015, 0.035, 0.015]} />
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.19, 0.11, 0]} scale={[0.05, 0.012, 0.24]} castShadow />
      
      {/* Dual exhaust pipes */}
      <mesh geometry={cylinderGeo} material={chromeMat} position={[-0.246, 0.036, 0.04]} rotation={[0, 0, Math.PI / 2]} scale={[0.012, 0.02, 0.012]} />
      <mesh geometry={cylinderGeo} material={chromeMat} position={[-0.246, 0.036, -0.04]} rotation={[0, 0, Math.PI / 2]} scale={[0.012, 0.02, 0.012]} />
      
      {/* Sleek slim headlights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.24, 0.06, 0.08]} scale={[0.015, 0.018, 0.05]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.24, 0.06, -0.08]} scale={[0.015, 0.018, 0.05]} />
      
      {/* Continuous rear LED taillight bar */}
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.246, 0.06, 0]} scale={[0.012, 0.015, 0.22]} />
      
      {/* Sport Wheels */}
      <Wheel position={[0.14, 0.042, 0.12]} rim={rimGoldMat} />
      <Wheel position={[0.14, 0.042, -0.12]} rim={rimGoldMat} />
      <Wheel position={[-0.14, 0.042, 0.12]} rim={rimGoldMat} />
      <Wheel position={[-0.14, 0.042, -0.12]} rim={rimGoldMat} />
    </group>
  );
});

// --- 3. City Taxi Model ---
const TaxiModel = React.memo(() => {
  const taxiYellowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.2 }), []);
  const checkerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 }), []);

  return (
    <group>
      {/* Black impact bumpers */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0.238, 0.05, 0]} scale={[0.02, 0.035, 0.23]} />
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.238, 0.05, 0]} scale={[0.02, 0.035, 0.23]} />
      
      {/* Lower body */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.045, 0]} scale={[0.48, 0.03, 0.23]} castShadow />
      
      {/* Yellow Hood */}
      <mesh geometry={boxGeo} material={taxiYellowMat} position={[0.13, 0.075, 0]} scale={[0.16, 0.05, 0.22]} castShadow />
      
      {/* Yellow Trunk */}
      <mesh geometry={boxGeo} material={taxiYellowMat} position={[-0.145, 0.075, 0]} scale={[0.13, 0.05, 0.22]} castShadow />
      
      {/* Checkered side accent strip */}
      <mesh geometry={boxGeo} material={checkerMat} position={[-0.01, 0.072, 0.112]} scale={[0.20, 0.015, 0.01]} />
      <mesh geometry={boxGeo} material={checkerMat} position={[-0.01, 0.072, -0.112]} scale={[0.20, 0.015, 0.01]} />
      
      {/* Yellow Cabin */}
      <mesh geometry={boxGeo} material={taxiYellowMat} position={[-0.01, 0.12, 0]} scale={[0.20, 0.065, 0.19]} castShadow />
      
      {/* Windshields & windows */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.088, 0.115, 0]} rotation={[0, 0, -Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.108, 0.115, 0]} rotation={[0, 0, Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.01, 0.122, 0]} scale={[0.17, 0.045, 0.196]} />
      
      {/* Roof "TAXI" sign pedestal and glowing box */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.01, 0.158, 0]} scale={[0.03, 0.012, 0.06]} />
      <mesh geometry={boxGeo} material={taxiSignMat} position={[-0.01, 0.176, 0]} scale={[0.08, 0.026, 0.09]} castShadow />
      
      {/* Headlights & Taillights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      
      {/* Wheels */}
      <Wheel position={[0.13, 0.044, 0.115]} />
      <Wheel position={[0.13, 0.044, -0.115]} />
      <Wheel position={[-0.13, 0.044, 0.115]} />
      <Wheel position={[-0.13, 0.044, -0.115]} />
    </group>
  );
});

// --- 4. City Transit Bus Model ---
const BusModel = React.memo(({ color }: { color: string }) => {
  const busBodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }), [color]);
  const busWhiteRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }), []);

  return (
    <group>
      {/* Lower bus chassis */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.05, 0]} scale={[0.55, 0.04, 0.24]} castShadow />
      
      {/* Lower body (livery color) */}
      <mesh geometry={boxGeo} material={busBodyMat} position={[0, 0.09, 0]} scale={[0.55, 0.06, 0.24]} castShadow />
      
      {/* Upper white window frame & roof */}
      <mesh geometry={boxGeo} material={busWhiteRoofMat} position={[0, 0.175, 0]} scale={[0.55, 0.04, 0.235]} castShadow />
      
      {/* Panoramic dark tinted side windows */}
      <mesh geometry={boxGeo} material={busWindowMat} position={[0, 0.135, 0]} scale={[0.46, 0.055, 0.244]} />
      
      {/* Large curved front windshield */}
      <mesh geometry={boxGeo} material={busWindowMat} position={[0.272, 0.13, 0]} scale={[0.015, 0.08, 0.22]} />
      
      {/* Route Destination Display (Amber glowing matrix sign) */}
      <mesh geometry={boxGeo} material={busSignMat} position={[0.274, 0.178, 0]} scale={[0.015, 0.024, 0.16]} />
      
      {/* Rear window */}
      <mesh geometry={boxGeo} material={busWindowMat} position={[-0.272, 0.14, 0]} scale={[0.015, 0.05, 0.18]} />
      
      {/* Dual Roof Air Conditioning units */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0.06, 0.20, 0]} scale={[0.09, 0.018, 0.14]} />
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.14, 0.20, 0]} scale={[0.09, 0.018, 0.14]} />
      
      {/* Front Headlights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.274, 0.07, 0.08]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.274, 0.07, -0.08]} scale={[0.015, 0.025, 0.04]} />
      
      {/* Rear vertical taillights */}
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.274, 0.085, 0.09]} scale={[0.015, 0.045, 0.025]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.274, 0.085, -0.09]} scale={[0.015, 0.045, 0.025]} />
      
      {/* Wheels */}
      <Wheel position={[0.17, 0.044, 0.12]} rim={rimDarkMat} />
      <Wheel position={[0.17, 0.044, -0.12]} rim={rimDarkMat} />
      <Wheel position={[-0.17, 0.044, 0.12]} rim={rimDarkMat} />
      <Wheel position={[-0.17, 0.044, -0.12]} rim={rimDarkMat} />
    </group>
  );
});

// --- 5. Delivery Cargo Van / Box Truck ---
const DeliveryModel = React.memo(({ color }: { color: string }) => {
  const cabMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 }), [color]);

  return (
    <group>
      {/* Chassis */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.045, 0]} scale={[0.50, 0.03, 0.24]} castShadow />
      
      {/* Front Cab */}
      <mesh geometry={boxGeo} material={cabMat} position={[0.155, 0.09, 0]} scale={[0.18, 0.09, 0.23]} castShadow />
      
      {/* Cab Windshield */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.238, 0.115, 0]} rotation={[0, 0, -Math.PI / 8]} scale={[0.015, 0.055, 0.20]} />
      
      {/* Cab side windows */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.155, 0.115, 0]} scale={[0.08, 0.04, 0.235]} />
      
      {/* Aerodynamic roof deflector wedge */}
      <mesh geometry={boxGeo} material={cabMat} position={[0.09, 0.155, 0]} scale={[0.06, 0.04, 0.22]} />
      
      {/* Large white cargo container box */}
      <mesh geometry={boxGeo} material={cargoBoxMat} position={[-0.09, 0.135, 0]} scale={[0.31, 0.15, 0.25]} castShadow />
      
      {/* Container rear roll-up door outline */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.246, 0.13, 0]} scale={[0.01, 0.13, 0.22]} />
      
      {/* Rear heavy-duty step bumper */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.245, 0.038, 0]} scale={[0.025, 0.02, 0.24]} />
      
      {/* Headlights & Taillights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.245, 0.065, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.245, 0.065, -0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.247, 0.055, 0.085]} scale={[0.015, 0.025, 0.03]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.247, 0.055, -0.085]} scale={[0.015, 0.025, 0.03]} />
      
      {/* Wheels */}
      <Wheel position={[0.15, 0.044, 0.12]} rim={rimDarkMat} />
      <Wheel position={[0.15, 0.044, -0.12]} rim={rimDarkMat} />
      <Wheel position={[-0.11, 0.044, 0.12]} rim={rimDarkMat} />
      <Wheel position={[-0.11, 0.044, -0.12]} rim={rimDarkMat} />
    </group>
  );
});

// --- 6. Pickup Truck with Cargo Bed ---
const PickupModel = React.memo(({ color }: { color: string }) => {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }), [color]);

  return (
    <group>
      {/* Lower chassis / high clearance */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.05, 0]} scale={[0.50, 0.03, 0.23]} castShadow />
      
      {/* Front Hood */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.14, 0.085, 0]} scale={[0.17, 0.055, 0.23]} castShadow />
      
      {/* Chrome front grille */}
      <mesh geometry={boxGeo} material={chromeMat} position={[0.23, 0.075, 0]} scale={[0.015, 0.04, 0.16]} />
      
      {/* Cab Body */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.025, 0.13, 0]} scale={[0.16, 0.07, 0.22]} castShadow />
      
      {/* Cab Windshield & Windows */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.108, 0.125, 0]} rotation={[0, 0, -Math.PI / 7]} scale={[0.015, 0.065, 0.20]} />
      <mesh geometry={boxGeo} material={windowMat} position={[0.025, 0.13, 0]} scale={[0.13, 0.045, 0.224]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.056, 0.13, 0]} scale={[0.015, 0.05, 0.18]} />
      
      {/* Open Cargo Bed Base */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.14, 0.07, 0]} scale={[0.22, 0.025, 0.23]} castShadow />
      
      {/* Bed Sidewalls */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.14, 0.095, 0.11]} scale={[0.22, 0.055, 0.015]} />
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.14, 0.095, -0.11]} scale={[0.22, 0.055, 0.015]} />
      
      {/* Tailgate */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.245, 0.095, 0]} scale={[0.015, 0.055, 0.23]} />
      
      {/* Cargo Load: Wooden Supply Crate */}
      <mesh geometry={boxGeo} material={woodCrateMat} position={[-0.13, 0.105, 0.02]} scale={[0.09, 0.07, 0.09]} castShadow />
      
      {/* Headlights & Taillights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.23, 0.08, 0.08]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.23, 0.08, -0.08]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.246, 0.08, 0.09]} scale={[0.015, 0.035, 0.025]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.246, 0.08, -0.09]} scale={[0.015, 0.035, 0.025]} />
      
      {/* Offroad Wheels */}
      <Wheel position={[0.13, 0.044, 0.115]} rim={rimSilverMat} />
      <Wheel position={[0.13, 0.044, -0.115]} rim={rimSilverMat} />
      <Wheel position={[-0.14, 0.044, 0.115]} rim={rimSilverMat} />
      <Wheel position={[-0.14, 0.044, -0.115]} rim={rimSilverMat} />
    </group>
  );
});

// --- 7. SUV / Crossover with Roof Rails & Spare Tire ---
const SuvModel = React.memo(({ color }: { color: string }) => {
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.3 }), [color]);

  return (
    <group>
      {/* Lower protective cladding */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.048, 0]} scale={[0.48, 0.035, 0.24]} castShadow />
      
      {/* Hood */}
      <mesh geometry={boxGeo} material={bodyMat} position={[0.125, 0.085, 0]} scale={[0.16, 0.05, 0.23]} castShadow />
      
      {/* Front Skid Plate */}
      <mesh geometry={boxGeo} material={chromeMat} position={[0.236, 0.04, 0]} scale={[0.015, 0.02, 0.14]} />
      
      {/* Spacious SUV Cabin */}
      <mesh geometry={boxGeo} material={bodyMat} position={[-0.03, 0.135, 0]} scale={[0.26, 0.075, 0.215]} castShadow />
      
      {/* Windshields & panoramic side glass */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.10, 0.128, 0]} rotation={[0, 0, -Math.PI / 7]} scale={[0.015, 0.07, 0.20]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.03, 0.135, 0]} scale={[0.23, 0.05, 0.22]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.161, 0.135, 0]} scale={[0.015, 0.05, 0.18]} />
      
      {/* Roof Rails */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.03, 0.18, 0.08]} scale={[0.22, 0.012, 0.015]} />
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.03, 0.18, -0.08]} scale={[0.22, 0.012, 0.015]} />
      
      {/* Exterior Tailgate Mounted Spare Wheel */}
      <mesh geometry={wheelTireGeo} material={tireMat} position={[-0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.9, 0.9, 0.9]}>
        <mesh geometry={wheelRimGeo} material={darkTrimMat} />
      </mesh>
      
      {/* Headlights & Taillights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.236, 0.085, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.236, 0.085, -0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.22, 0.11, 0.085]} scale={[0.015, 0.04, 0.025]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.22, 0.11, -0.085]} scale={[0.015, 0.04, 0.025]} />
      
      {/* Wheels */}
      <Wheel position={[0.13, 0.044, 0.118]} />
      <Wheel position={[0.13, 0.044, -0.118]} />
      <Wheel position={[-0.13, 0.044, 0.118]} />
      <Wheel position={[-0.13, 0.044, -0.118]} />
    </group>
  );
});

// --- 8. Police Interceptor Cruiser ---
const PoliceModel = React.memo(() => {
  const blackMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.35, metalness: 0.4 }), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }), []);

  return (
    <group>
      {/* Front heavy-duty push bumper */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0.244, 0.065, 0]} scale={[0.025, 0.05, 0.15]} />
      
      {/* Lower chassis */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[0, 0.045, 0]} scale={[0.48, 0.03, 0.23]} castShadow />
      
      {/* Black Hood */}
      <mesh geometry={boxGeo} material={blackMat} position={[0.13, 0.075, 0]} scale={[0.16, 0.05, 0.22]} castShadow />
      
      {/* Black Trunk */}
      <mesh geometry={boxGeo} material={blackMat} position={[-0.145, 0.075, 0]} scale={[0.13, 0.05, 0.22]} castShadow />
      
      {/* White Doors & Cabin Section */}
      <mesh geometry={boxGeo} material={whiteMat} position={[-0.01, 0.075, 0]} scale={[0.12, 0.05, 0.225]} />
      <mesh geometry={boxGeo} material={whiteMat} position={[-0.01, 0.12, 0]} scale={[0.20, 0.065, 0.19]} castShadow />
      
      {/* Windshields & windows */}
      <mesh geometry={boxGeo} material={windowMat} position={[0.088, 0.115, 0]} rotation={[0, 0, -Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.108, 0.115, 0]} rotation={[0, 0, Math.PI / 7]} scale={[0.015, 0.065, 0.18]} />
      <mesh geometry={boxGeo} material={windowMat} position={[-0.01, 0.122, 0]} scale={[0.17, 0.045, 0.196]} />
      
      {/* Emergency Light Bar on Roof */}
      <mesh geometry={boxGeo} material={darkTrimMat} position={[-0.01, 0.158, 0]} scale={[0.03, 0.012, 0.14]} />
      <mesh geometry={boxGeo} material={policeSirenRedMat} position={[-0.01, 0.175, 0.045]} scale={[0.035, 0.024, 0.05]} />
      <mesh geometry={boxGeo} material={policeSirenBlueMat} position={[-0.01, 0.175, -0.045]} scale={[0.035, 0.024, 0.05]} />
      
      {/* Headlights & Taillights */}
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={headlightMat} position={[0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, 0.075]} scale={[0.015, 0.025, 0.04]} />
      <mesh geometry={boxGeo} material={taillightMat} position={[-0.237, 0.075, -0.075]} scale={[0.015, 0.025, 0.04]} />
      
      {/* Wheels */}
      <Wheel position={[0.13, 0.044, 0.115]} rim={rimDarkMat} />
      <Wheel position={[0.13, 0.044, -0.115]} rim={rimDarkMat} />
      <Wheel position={[-0.13, 0.044, 0.115]} rim={rimDarkMat} />
      <Wheel position={[-0.13, 0.044, -0.115]} rim={rimDarkMat} />
    </group>
  );
});

// Master Detailed Vehicle Component
export const DetailedVehicle = React.memo(({ type, color }: { type: VehicleType; color: string }) => {
  switch (type) {
    case 'sports':
      return <SportsCarModel color={color} />;
    case 'taxi':
      return <TaxiModel />;
    case 'bus':
      return <BusModel color={color} />;
    case 'delivery':
      return <DeliveryModel color={color} />;
    case 'pickup':
      return <PickupModel color={color} />;
    case 'suv':
      return <SuvModel color={color} />;
    case 'police':
      return <PoliceModel />;
    case 'sedan':
    default:
      return <SedanModel color={color} />;
  }
});

interface VehicleRuntimeData {
  id: number;
  type: VehicleType;
  color: string;
  speed: number;
  curX: number;
  curY: number;
  tarX: number;
  tarY: number;
  prevX: number;
  prevY: number;
  progress: number;
  currentAngle: number;
}

// --- Traffic Simulation System ---
export const TrafficSystem = ({ grid }: { grid: Grid }) => {
  const roadTiles = useMemo(() => {
    const roads: { x: number; y: number }[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) roads.push({ x: tile.x, y: tile.y });
    }));
    return roads;
  }, [grid]);

  const carCount = Math.min(roadTiles.length, 28);

  const [vehicles, setVehicles] = useState<VehicleRuntimeData[]>([]);
  const vehicleListRef = useRef<VehicleRuntimeData[]>([]);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Initialize vehicles with realistic variety, speeds, and colors
  useEffect(() => {
    if (roadTiles.length < 2) {
      vehicleListRef.current = [];
      setVehicles([]);
      return;
    }

    const newVehicles: VehicleRuntimeData[] = [];

    for (let i = 0; i < carCount; i++) {
      const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
      let color = '#dc2626';
      let speed = 0.02;

      switch (type) {
        case 'sports':
          color = SPORTS_COLORS[i % SPORTS_COLORS.length];
          speed = 0.025 + Math.random() * 0.008;
          break;
        case 'taxi':
          color = '#f59e0b';
          speed = 0.02 + Math.random() * 0.006;
          break;
        case 'bus':
          color = BUS_COLORS[i % BUS_COLORS.length];
          speed = 0.013 + Math.random() * 0.004; // Buses move steadily
          break;
        case 'delivery':
          color = DELIVERY_COLORS[i % DELIVERY_COLORS.length];
          speed = 0.016 + Math.random() * 0.005;
          break;
        case 'pickup':
          color = PICKUP_COLORS[i % PICKUP_COLORS.length];
          speed = 0.019 + Math.random() * 0.006;
          break;
        case 'suv':
          color = SUV_COLORS[i % SUV_COLORS.length];
          speed = 0.02 + Math.random() * 0.005;
          break;
        case 'police':
          color = '#09090b';
          speed = 0.023 + Math.random() * 0.007;
          break;
        case 'sedan':
        default:
          color = SEDAN_COLORS[i % SEDAN_COLORS.length];
          speed = 0.018 + Math.random() * 0.006;
          break;
      }

      const startTile = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      
      // Look for neighboring road tile to establish initial direction
      const neighbors = roadTiles.filter(t => 
        (Math.abs(t.x - startTile.x) === 1 && t.y === startTile.y) || 
        (Math.abs(t.y - startTile.y) === 1 && t.x === startTile.x)
      );

      const targetTile = neighbors.length > 0 ? neighbors[0] : startTile;
      const initialAngle = Math.atan2(targetTile.y - startTile.y, targetTile.x - startTile.x);

      newVehicles.push({
        id: i,
        type,
        color,
        speed,
        curX: startTile.x,
        curY: startTile.y,
        tarX: targetTile.x,
        tarY: targetTile.y,
        prevX: startTile.x,
        prevY: startTile.y,
        progress: Math.random(), // Stagger positions along the route
        currentAngle: initialAngle,
      });
    }

    vehicleListRef.current = newVehicles;
    setVehicles(newVehicles);
  }, [roadTiles, carCount]);

  // Frame update: update vehicle movement, turn angles, lane positions, and sirens
  useFrame((state) => {
    if (roadTiles.length < 2 || vehicleListRef.current.length === 0) return;

    // Emergency lights strobe
    const flash = Math.floor(state.clock.elapsedTime * 6) % 2 === 0;
    policeSirenRedMat.emissiveIntensity = flash ? 2.5 : 0.2;
    policeSirenBlueMat.emissiveIntensity = flash ? 0.2 : 2.5;

    const currentVehicles = vehicleListRef.current;

    for (let i = 0; i < currentVehicles.length; i++) {
      const v = currentVehicles[i];
      const grp = groupRefs.current[i];
      if (!grp) continue;

      v.progress += v.speed;

      if (v.progress >= 1) {
        v.prevX = v.curX;
        v.prevY = v.curY;
        v.curX = v.tarX;
        v.curY = v.tarY;
        v.progress = 0;

        // Pathfinding: find connected roads, prefer continuing forward instead of reversing
        const neighbors = roadTiles.filter(t => 
          (Math.abs(t.x - v.curX) === 1 && t.y === v.curY) || 
          (Math.abs(t.y - v.curY) === 1 && t.x === v.curX)
        );

        if (neighbors.length > 0) {
          const nonReversing = neighbors.filter(n => !(n.x === v.prevX && n.y === v.prevY));
          const valid = nonReversing.length > 0 ? nonReversing : neighbors;
          const next = valid[Math.floor(Math.random() * valid.length)];
          v.tarX = next.x;
          v.tarY = next.y;
        } else {
          const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
          v.curX = rnd.x;
          v.curY = rnd.y;
          v.tarX = rnd.x;
          v.tarY = rnd.y;
        }
      }

      // Linear interpolation between tiles
      const gx = THREE.MathUtils.lerp(v.curX, v.tarX, v.progress);
      const gy = THREE.MathUtils.lerp(v.curY, v.tarY, v.progress);

      const dx = v.tarX - v.curX;
      const dy = v.tarY - v.curY;
      const targetAngle = Math.atan2(dy, dx);

      // Right-side lane offset (keeps cars in their respective lanes without collisions)
      const offsetAmt = 0.14;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const offX = (-dy / len) * offsetAmt;
      const offY = (dx / len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Smooth heading rotation interpolation
      let angleDiff = targetAngle - v.currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      v.currentAngle += angleDiff * 0.25;

      // Road elevation is -0.29; vehicle sits with wheel base touching the road
      grp.position.set(wx, -0.29, wz);
      grp.rotation.set(0, -v.currentAngle, 0);
    }
  });

  if (roadTiles.length < 2) return null;

  return (
    <group raycast={() => null}>
      {vehicles.map((v, i) => (
        <group
          key={v.id}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[0, -100, 0]}
        >
          <DetailedVehicle type={v.type} color={v.color} />
        </group>
      ))}
    </group>
  );
};
