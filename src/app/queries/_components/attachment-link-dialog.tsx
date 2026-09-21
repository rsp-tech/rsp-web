"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AttachmentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (link: { uri: string; title: string }) => void;
}

export const AttachmentLinkDialog = ({
  open,
  onOpenChange,
  onAddLink,
}: AttachmentLinkDialogProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = linkUrl.trim();
    if (!url) {
      toast.error("Please enter a URL.");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must begin with http:// or https://");
      return;
    }

    onAddLink({
      uri: url,
      title: linkTitle.trim() || url,
    });

    setLinkUrl("");
    setLinkTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleAddLink}>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Attach a relevant web link or reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url-web">URL *</Label>
              <Input
                id="link-url-web"
                placeholder="https://example.com/verse"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-title-web">Title (Optional)</Label>
              <Input
                id="link-title-web"
                placeholder="Bhagavad Gita 2.13"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!linkUrl.trim()}>
              Add Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
