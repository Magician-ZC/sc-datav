// 福建省城市数据 - 用于CRM工作台地图展示
// population: 用于柱状图高度（客户数量/100）
export default {
  福州市: { population: 1250, totalCustomers: "1,250", touchedRate: "68%", convertRate: "42%" },
  厦门市: { population: 980, totalCustomers: "980", touchedRate: "72%", convertRate: "45%" },
  莆田市: { population: 650, totalCustomers: "650", touchedRate: "65%", convertRate: "38%" },
  三明市: { population: 420, totalCustomers: "420", touchedRate: "58%", convertRate: "35%" },
  泉州市: { population: 1580, totalCustomers: "1,580", touchedRate: "70%", convertRate: "44%" },
  漳州市: { population: 890, totalCustomers: "890", touchedRate: "62%", convertRate: "40%" },
  南平市: { population: 380, totalCustomers: "380", touchedRate: "55%", convertRate: "32%" },
  龙岩市: { population: 520, totalCustomers: "520", touchedRate: "60%", convertRate: "36%" },
  宁德市: { population: 480, totalCustomers: "480", touchedRate: "63%", convertRate: "39%" },
} satisfies Record<string, { population: number; totalCustomers: string; touchedRate: string; convertRate: string }>;
