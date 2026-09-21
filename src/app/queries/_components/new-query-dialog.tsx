"use client";

import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { UserQuery } from "@/types";
import { QueryForm } from "./query-form";

interface NewQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onSuccess: (createdQuery: UserQuery) => void;
}

export const NewQueryDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: NewQueryDialogProps) => {
  const isMobile = useIsMobile();

  const handleSuccess = (createdQuery: UserQuery) => {
    onSuccess(createdQuery);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: isMobile ? "calc(100% - 2rem)" : "36rem",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
        className="gap-4 p-6"
      >
        <DialogHeader className="flex flex-col gap-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Create New Ticket</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submit your question, technical feedback, or spiritual inquiry to
            the team.
          </DialogDescription>
        </DialogHeader>

        <QueryForm
          isDialog
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
