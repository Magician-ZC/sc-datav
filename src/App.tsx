import { Route, Routes } from "react-router";
import Demo0 from "@/pages/Demo0";
import Demo1 from "@/pages/Demo1";

function App() {
  return (
    <Routes>
      {/* 默认显示福建省3D地图（CRM工作台用） */}
      <Route path="/" element={<Demo1 />} />
      <Route path="/demo0" element={<Demo0 />} />
      <Route path="/demo1" element={<Demo1 />} />
    </Routes>
  );
}

export default App;
