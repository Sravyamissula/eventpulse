"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cpu, ShieldCheck, Zap, Server, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  color: number;
  glowColor: string;
  technology: string;
  responsibility: string;
  status: string;
}

export default function InfrastructureScene3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a0f, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 3, 50);
    cyanLight.position.set(10, 10, 10);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.5, 50);
    purpleLight.position.set(-10, -5, -5);
    scene.add(purpleLight);

    // 3. Topology Nodes Specification
    const nodesData: NodeData[] = [
      {
        id: "client",
        name: "Client / Producer",
        type: "INGESTION_SOURCE",
        position: [-9, 2, 0],
        color: 0x38bdf8,
        glowColor: "#38bdf8",
        technology: "REST API / SDK",
        responsibility: "Dispatches events with X-API-Key and idempotency key",
        status: "ACTIVE",
      },
      {
        id: "gateway",
        name: "Security Gateway",
        type: "AUTHENTICATION",
        position: [-5.5, 1.5, 1],
        color: 0x06b6d4,
        glowColor: "#06b6d4",
        technology: "Spring Security 6",
        responsibility: "Validates SHA-256 hashed API keys & establishes tenant isolation",
        status: "SECURED",
      },
      {
        id: "ingestion",
        name: "Idempotency Filter",
        type: "DEDUPLICATION",
        position: [-2, 2.5, -0.5],
        color: 0x818cf8,
        glowColor: "#818cf8",
        technology: "Spring Data JPA / DB Unique Key",
        responsibility: "Guarantees exactly-once processing via compound constraint",
        status: "VERIFIED",
      },
      {
        id: "postgres",
        name: "PostgreSQL 17.4",
        type: "STORAGE",
        position: [-2, -2, 0],
        color: 0x3b82f6,
        glowColor: "#3b82f6",
        technology: "PostgreSQL / Flyway Migrations",
        responsibility: "Immutable event ledger & transactional delivery states",
        status: "CONNECTED",
      },
      {
        id: "workerpool",
        name: "Delivery Worker Pool",
        type: "CONCURRENCY",
        position: [2, 1, 0.5],
        color: 0xa855f7,
        glowColor: "#a855f7",
        technology: "Thread Pool / Transactional Dispatch",
        responsibility: "Concurrent HTTP dispatch & HMAC-SHA256 signature generation",
        status: "RUNNING",
      },
      {
        id: "ratelimiter",
        name: "Token Bucket Limiter",
        type: "PROTECTION",
        position: [2, -2, -1],
        color: 0xf59e0b,
        glowColor: "#f59e0b",
        technology: "Sliding-Window In-Memory Limiter",
        responsibility: "Enforces consumer requests/min capacity to prevent overload",
        status: "ENFORCING",
      },
      {
        id: "webhook_1",
        name: "Consumer Endpoint (Stripe)",
        type: "DESTINATION",
        position: [7.5, 3, -1],
        color: 0x10b981,
        glowColor: "#10b981",
        technology: "HTTPS Webhook",
        responsibility: "Healthy consumer receiving 200 OK responses",
        status: "HEALTHY",
      },
      {
        id: "webhook_2",
        name: "Consumer Endpoint (CRM)",
        type: "DESTINATION",
        position: [8, 0, 1.5],
        color: 0x10b981,
        glowColor: "#10b981",
        technology: "HTTPS Webhook",
        responsibility: "Healthy consumer receiving 202 Accepted",
        status: "HEALTHY",
      },
      {
        id: "circuit_breaker",
        name: "Circuit Breaker",
        type: "FAULT_ISOLATION",
        position: [6, -2.5, 0],
        color: 0xf43f5e,
        glowColor: "#f43f5e",
        technology: "State Machine (Closed / Open / Half-Open)",
        responsibility: "Isolates failing consumers after 5 consecutive errors",
        status: "MONITORING",
      },
      {
        id: "dlq",
        name: "Dead Letter Queue",
        type: "QUARANTINE",
        position: [8.5, -3.5, 1],
        color: 0xef4444,
        glowColor: "#ef4444",
        technology: "DLQ Storage & Manual Redrive",
        responsibility: "Quarantines exhausted retries for manual or automated resolution",
        status: "ISOLATED",
      },
      {
        id: "ai_service",
        name: "FastAPI AI Intelligence",
        type: "ROOT_CAUSE_DIAGNOSIS",
        position: [0.5, 4, 1],
        color: 0xd946ef,
        glowColor: "#d946ef",
        technology: "Python 3.11 / FastAPI / Gemini",
        responsibility: "Analyzes error patterns, HTTP status & suggests remediations",
        status: "ACTIVE",
      },
    ];

    // Create 3D Meshes for Nodes
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeMeshMap = new Map<THREE.Mesh, NodeData>();

    const sphereGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const ringGeo = new THREE.RingGeometry(0.7, 0.8, 32);

    nodesData.forEach((node) => {
      // Core sphere
      const mat = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.2,
        metalness: 0.7,
        emissive: node.color,
        emissiveIntensity: 0.4,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(...node.position);
      scene.add(mesh);
      nodeMeshes.push(mesh);
      nodeMeshMap.set(mesh, node);

      // Glowing orbit ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(...node.position);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });

    // 4. Connective Curves / Pipelines
    const connections: [string, string][] = [
      ["client", "gateway"],
      ["gateway", "ingestion"],
      ["ingestion", "postgres"],
      ["ingestion", "workerpool"],
      ["workerpool", "ratelimiter"],
      ["workerpool", "webhook_1"],
      ["workerpool", "webhook_2"],
      ["workerpool", "circuit_breaker"],
      ["circuit_breaker", "dlq"],
      ["dlq", "ai_service"],
      ["workerpool", "ai_service"],
    ];

    const curves: THREE.CatmullRomCurve3[] = [];
    connections.forEach(([fromId, toId]) => {
      const fromNode = nodesData.find((n) => n.id === fromId);
      const toNode = nodesData.find((n) => n.id === toId);
      if (!fromNode || !toNode) return;

      const p1 = new THREE.Vector3(...fromNode.position);
      const p2 = new THREE.Vector3(...toNode.position);
      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 0.3, 0));

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      curves.push(curve);

      const points = curve.getPoints(40);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    });

    // 5. Flowing Event Packets
    interface Packet {
      curveIndex: number;
      progress: number;
      speed: number;
      mesh: THREE.Mesh;
    }

    const packetGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const packets: Packet[] = [];
    const packetCount = 14;

    for (let i = 0; i < packetCount; i++) {
      const curveIndex = Math.floor(Math.random() * curves.length);
      const color = (i % 4 === 0) ? 0xef4444 : (i % 3 === 0 ? 0xd946ef : 0x38bdf8);
      const packetMat = new THREE.MeshBasicMaterial({ color });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      scene.add(packetMesh);

      packets.push({
        curveIndex,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.005,
        mesh: packetMesh,
      });
    }

    // 6. Ambient Particle Dust
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i++) {
      dustPositions[i] = (Math.random() - 0.5) * 35;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // 7. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let targetCameraX = 0;
    let targetCameraY = 4;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouse.x = (x / width) * 2 - 1;
      mouse.y = -(y / height) * 2 + 1;

      targetCameraX = (mouse.x * 2.5);
      targetCameraY = 4 + (mouse.y * 1.5);

      setTooltipPos({ x: event.clientX, y: event.clientY });
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop with Performance Guard
    let animationId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

    // IntersectionObserver to pause rendering when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();

      // Smooth camera parallax
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Rotate nodes subtly
      nodeMeshes.forEach((mesh) => {
        mesh.rotation.y += 0.01;
      });

      // Move packets along curves
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.curveIndex = Math.floor(Math.random() * curves.length);
        }
        const curve = curves[p.curveIndex];
        const pt = curve.getPointAt(p.progress);
        p.mesh.position.copy(pt);
      });

      // Slowly rotate dust
      dust.rotation.y += 0.0006;

      // Raycasting for Hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const data = nodeMeshMap.get(hitMesh) || null;
        setHoveredNode(data);
        document.body.style.cursor = "pointer";
      } else {
        setHoveredNode(null);
        document.body.style.cursor = "default";
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      sphereGeo.dispose();
      ringGeo.dispose();
      dustGeo.dispose();
      packetGeo.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-glow select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
      <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 text-xs font-mono text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>DISTRIBUTED TOPOLOGY ENGINE — 3D INTERACTIVE</span>
      </div>

      <div className="absolute bottom-4 left-6 right-6 pointer-events-none flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Hover nodes to inspect engineering responsibilities & telemetry</span>
        <span className="text-cyan-400/80 hidden sm:inline">WebGL 60FPS</span>
      </div>

      {/* Hover Node Detail HUD Card */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none bottom-14 left-6 max-w-sm glass-panel p-4 rounded-xl border border-cyan-500/40 text-xs font-mono space-y-2 shadow-glow animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredNode.glowColor }} />
              {hoveredNode.name}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: `${hoveredNode.glowColor}22`,
                color: hoveredNode.glowColor,
                border: `1px solid ${hoveredNode.glowColor}44`,
              }}
            >
              {hoveredNode.status}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <p>
              <strong className="text-slate-400 uppercase text-[9px]">Tech:</strong> {hoveredNode.technology}
            </p>
            <p className="text-slate-300 leading-relaxed">{hoveredNode.responsibility}</p>
          </div>
        </div>
      )}
    </div>
  );
}
