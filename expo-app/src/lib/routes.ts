export type RouteId = "home" | "make" | "health" | "calendar" | "family" | "photo-frame" | "settings";

/** Main navigation in the prototype's order: 首頁 → 做菜 → 健康 → 行事曆 → 積分 → 相框 → 設定 */
export const ROUTES: { id: RouteId; href: string; label: string; icon: string }[] = [
  { id: "home", href: "/", label: "首頁", icon: "house" },
  { id: "make", href: "/make", label: "做菜", icon: "chef-hat" },
  { id: "health", href: "/health", label: "健康", icon: "shield-plus" },
  { id: "calendar", href: "/calendar", label: "行事曆", icon: "calendar-days" },
  { id: "family", href: "/family", label: "積分", icon: "trophy" },
  { id: "photo-frame", href: "/photo-frame", label: "相框", icon: "images" },
  { id: "settings", href: "/settings", label: "設定", icon: "settings" },
];

export function routeIdFor(pathname: string): RouteId {
  const first = pathname.split("?")[0].split("/").filter(Boolean)[0] || "";
  const match = ROUTES.find((r) => r.id === first);
  return match ? match.id : "home";
}
