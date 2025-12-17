# CRM工作台 3D地图组件

基于 [sc-datav](https://github.com/knight-L/sc-datav) 项目修改，用于CRM工作台的福建省3D客户分布地图展示。

## 功能特性

- 3D福建省地图可视化（基于Three.js）
- 各市客户数据柱状图展示
- 鼠标悬停显示客户统计信息（客户总数、触达率、转化率）
- 支持旋转、缩放交互

## 技术栈

- React 19 + TypeScript
- Three.js + @react-three/fiber
- Vite (Rolldown)
- Styled-components

## 开发

```bash
cd sc_datav_map

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建（输出到 ../static/datav/）
pnpm build
```

## 数据配置

城市数据位于 `src/pages/Demo1/cityData.ts`，可根据实际CRM数据进行修改：

```typescript
export default {
  福州市: { population: 1250, totalCustomers: "1,250", touchedRate: "68%", convertRate: "42%" },
  // ... 其他城市
}
```

## 集成说明

构建后的文件输出到 `static/datav/` 目录，通过iframe嵌入到CRM工作台dashboard页面：

```html
<iframe src="/static/datav/index.html" style="width: 100%; height: 600px; border: none;"></iframe>
```

## 地图数据

- `src/assets/fj.json` - 福建省各市GeoJSON数据
- `src/assets/fj_outline.json` - 福建省轮廓数据

数据来源：阿里云DataV GeoAtlas
