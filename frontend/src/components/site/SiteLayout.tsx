import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
// import { CommodityMarquee } from "./CommodityMarquee";

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      {/* <CommodityMarquee /> */}
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
