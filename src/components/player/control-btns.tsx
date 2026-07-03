import { Minimize2, X } from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SpeedControlPopover } from "./speed-controls";
import { VolumeControlPopover } from "./volume-controls";

type ControlBtnsProps = {
  handleMinimizeToggle: (minimized: boolean) => void;
  forMobile?: boolean;
};
export const ControlBtns = ({
  handleMinimizeToggle,
  forMobile,
}: ControlBtnsProps) => (
  <div
    className={cn(
      "items-center gap-1.5 shrink-0 text-muted-foreground",
      forMobile ? "flex md:hidden" : "hidden md:flex",
    )}
  >
    <SpeedControlPopover />
    <VolumeControlPopover />
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleMinimizeToggle(true)}
      className="rounded-full h-8 w-8 flex items-center justify-center cursor-pointer"
      title="Minimize Player"
    >
      <Minimize2 className="w-4 h-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => audioEngine.dismiss()}
      className="rounded-full h-8 w-8 flex items-center justify-center cursor-pointer"
      title="Dismiss Player"
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
);
