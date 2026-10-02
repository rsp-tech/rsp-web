"use client";

import { Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertLink: (url: string, text?: string) => void;
}

export const CustomLinkDialog = ({
  open,
  onOpenChange,
  onInsertLink,
}: CustomLinkDialogProps) => {
  const [customLinkUrl, setCustomLinkUrl] = useState("");
  const [customLinkText, setCustomLinkText] = useState("");

  useEffect(() => {
    if (!open) {
      setCustomLinkUrl("");
      setCustomLinkText("");
    }
  }, [open]);

  const handleSubmit = () => {
    const url = customLinkUrl.trim();
    if (!url) return;
    onInsertLink(url, customLinkText.trim() || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 gap-3">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span>Insert Web Link</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="custom-link-url"
              className="text-xs font-medium text-muted-foreground"
            >
              Link URL
            </Label>
            <Input
              id="custom-link-url"
              type="url"
              placeholder="https://example.com"
              value={customLinkUrl}
              onChange={(e) => setCustomLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customLinkUrl.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="text-xs"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor="custom-link-text"
              className="text-xs font-medium text-muted-foreground"
            >
              Display Text (optional)
            </Label>
            <Input
              id="custom-link-text"
              type="text"
              placeholder="Click here"
              value={customLinkText}
              onChange={(e) => setCustomLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customLinkUrl.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!customLinkUrl.trim()}
              className="cursor-pointer"
            >
              Insert Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
