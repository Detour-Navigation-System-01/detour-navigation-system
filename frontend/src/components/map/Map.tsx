"use client";

import MapView from "./MapView";
import NavigationButtons from "@/components/NavigationButtons/NavigationButtons";

export default function Map() {
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <NavigationButtons />
      <MapView />
    </div>
  );
}
