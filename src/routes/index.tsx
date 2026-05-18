import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام إدارة ضمان الألواح الشمسية" },
      { name: "description", content: "Solar Warranty System — mobile-first field management." },
    ],
  }),
  component: App,
});

function App() {
  return (
    <iframe
      src="/legacy.html"
      title="Solar Warranty System"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}
