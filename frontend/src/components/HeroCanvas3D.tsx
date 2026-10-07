"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Subtle cinematic 3D depth layer featuring floating particles,
 * gentle light trails, and moving event signal pulses.
 * Highly performant: uses requestAnimationFrame discipline and cleans up resources.
 */
export default function HeroCanvas3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 1. Particle Cloud with Depth
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 80;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      particleVel[i] = 0.02 + Math.random() * 0.04;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 2. Light Trails / Event Stream Splines
    const curvePoints1 = [
      new THREE.Vector3(-40, -15, -20),
      new THREE.Vector3(-15, 10, -5),
      new THREE.Vector3(15, -8, 10),
      new THREE.Vector3(40, 15, -15),
    ];
    const curvePoints2 = [
      new THREE.Vector3(-45, 18, -10),
      new THREE.Vector3(-10, -12, 5),
      new THREE.Vector3(20, 14, -10),
      new THREE.Vector3(45, -10, 15),
    ];

    const curve1 = new THREE.CatmullRomCurve3(curvePoints1);
    const curve2 = new THREE.CatmullRomCurve3(curvePoints2);

    const tubeGeo1 = new THREE.TubeGeometry(curve1, 64, 0.08, 8, false);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, 64, 0.08, 8, false);

    const trailMat1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.22,
    });
    const trailMat2 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.18,
    });

    const trailMesh1 = new THREE.Mesh(tubeGeo1, trailMat1);
    const trailMesh2 = new THREE.Mesh(tubeGeo2, trailMat2);
    scene.add(trailMesh1);
    scene.add(trailMesh2);

    // 3. Moving Event Signals (Glowing Orbs moving along curves)
    const signalGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const signalMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const signalMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8 });

    const signal1 = new THREE.Mesh(signalGeo, signalMat1);
    const signal2 = new THREE.Mesh(signalGeo, signalMat2);
    scene.add(signal1);
    scene.add(signal2);

    let progress1 = 0;
    let progress2 = 0.5;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Progress moving signals
      progress1 = (progress1 + 0.003) % 1;
      progress2 = (progress2 + 0.0025) % 1;

      const pos1 = curve1.getPointAt(progress1);
      const pos2 = curve2.getPointAt(progress2);
      signal1.position.copy(pos1);
      signal2.position.copy(pos2);

      // Rotate particle cloud gently
      particlePoints.rotation.y += 0.0003;
      particlePoints.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      tubeGeo1.dispose();
      tubeGeo2.dispose();
      trailMat1.dispose();
      trailMat2.dispose();
      signalGeo.dispose();
      signalMat1.dispose();
      signalMat2.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-75"
      aria-hidden="true"
    />
  );
}
