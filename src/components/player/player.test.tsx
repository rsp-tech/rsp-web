import { describe, expect, it } from "vitest";
import { ControlBtns } from "./control-btns";
import { PlayPauseButton } from "./play-pause-button";
import { SpeedControlPopover } from "./speed-controls";
import { TimelineSlider } from "./timeline-slider";
import { VolumeControlPopover } from "./volume-controls";

describe.concurrent("player components suite", () => {
  it.concurrent("exports player control components", () => {
    expect(typeof ControlBtns).toBe("function");
    expect(typeof PlayPauseButton).toBe("function");
    expect(typeof SpeedControlPopover).toBe("function");
    expect(typeof TimelineSlider).toBe("function");
    expect(typeof VolumeControlPopover).toBe("function");
  });
});
