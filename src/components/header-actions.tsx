import { NotificationCenter } from "./notification-center";
import { ThemeSelector } from "./theme-selector";
import { UserNav } from "./user-nav";

export const HeaderActions = () => (
  <div className="flex items-center gap-3 shrink-0">
    <div className="hidden md:flex">
      <ThemeSelector />
    </div>
    <NotificationCenter />
    <div className="hidden md:flex">
      <UserNav />
    </div>
  </div>
);
