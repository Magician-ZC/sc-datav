import { Suspense } from "react";
import Cloud from "./cloud";
import Base from "./base";
import Bottom from "./bottom";
import DistrictMap from "./districtMap";
import type { CityGeoJSON } from "@/types/map";
import { useConfigStore } from "../stores";

// 使用福建省地图数据
import fjMapData from "@/assets/fj.json";
import fjOutlineData from "@/assets/fj_outline.json";

const mapData = fjMapData as CityGeoJSON,
  outlineData = fjOutlineData as CityGeoJSON;

export default function Scene() {
  const viewLevel = useConfigStore((s) => s.viewLevel);
  const selectedCityCode = useConfigStore((s) => s.selectedCityCode);

  return (
    <Suspense fallback={null}>
      <Cloud />

      {viewLevel === "province" ? (
        <Base data={mapData} outlineData={outlineData} />
      ) : (
        selectedCityCode && <DistrictMap cityCode={selectedCityCode} />
      )}

      <Bottom />
    </Suspense>
  );
}
