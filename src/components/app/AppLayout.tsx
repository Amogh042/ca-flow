import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-background bg-grid">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
