"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { resetGuide, stopGuide, updateGuide } from "@/lib/guide";

/** Runs the voice guide director once per frame (it throttles itself). Remounted with every expedition. */
export default function Guide() {
  useEffect(() => {
    resetGuide();
    return () => stopGuide();
  }, []);
  useFrame(() => updateGuide());
  return null;
}
