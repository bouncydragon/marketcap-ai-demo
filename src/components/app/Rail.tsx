"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/use-theme";
import { IconChartBars, IconGrid, IconHome, IconLogout, IconMoon, IconPie, IconSettings, IconSidebar, IconSparkle, IconSun, IconWallet } from "./Icons";

const items = [
  { label: "Home", icon: IconHome },
  { label: "Wallet", icon: IconWallet },
  { label: "Dashboard", icon: IconGrid, active: true },
  { label: "Allocation", icon: IconPie },
  { label: "Analytics", icon: IconChartBars },
  { label: "Insights", icon: IconSparkle },
];

export function Rail() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };
  const dark = theme === "dark";

  return (
    <aside className="rail" aria-label="Main">
      <div className="rail-logo" aria-label="MarketCap">
        <svg width="22" height="24" viewBox="0 0 20 22" aria-hidden><path d="M12.5 1 2 12.5h6.2L6.5 21 18 8.5h-6.4L12.5 1Z" fill="currentColor" /></svg>
      </div>
      <button className="rail-btn plain" aria-disabled title="Collapse (coming soon)" aria-label="Collapse sidebar">
        <IconSidebar />
      </button>
      <nav className="rail-nav">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`rail-btn${active ? " active" : ""}`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            aria-disabled={!active}
            title={active ? label : `${label} (coming soon)`}
          >
            <Icon />
          </button>
        ))}
      </nav>
      <div className="rail-bottom">
        <button className="rail-btn plain" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
          {dark ? <IconSun /> : <IconMoon />}
        </button>
        <button className="rail-btn plain" aria-disabled aria-label="Settings" title="Settings (coming soon)"><IconSettings /></button>
        <button className="rail-btn plain" onClick={signOut} aria-label="Log out" title="Log out"><IconLogout /></button>
      </div>
    </aside>
  );
}
