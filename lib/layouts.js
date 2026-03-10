const layoutRules = [
  {
    layout: "none",
    match: (pathname) => pathname === "/dashboard" || pathname === "/a/journal/[id]",
  },
  {
    layout: "dashboard",
    match: (pathname) => pathname.startsWith("/a"),
  },
  {
    layout: "landing",
    match: (pathname) => pathname === "/" || pathname === "/login",
  },
];

export function resolveLayout(pathname) {
  return layoutRules.find((rule) => rule.match(pathname))?.layout || "none";
}

export function requiresDashboardSession(pathname) {
  return pathname.startsWith("/a");
}
