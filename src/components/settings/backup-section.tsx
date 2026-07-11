"use client";

import * as React from "react";
import { Database, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BackupSection() {
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [restoring, setRestoring] = React.useState(false);

  const handleRestore = async () => {
    if (!file || confirmText !== "RESTORE") return;
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/backup/import", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Restore failed");
      }
      toast.success("Database restored successfully. Reloading...");
      setRestoreOpen(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Card className="glass-card border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4" /> Backup &amp; Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button variant="outline" asChild>
          <a href="/api/backup/export">
            <Download /> Backup Database
          </a>
        </Button>
        <Button variant="destructive" onClick={() => setRestoreOpen(true)}>
          <Upload /> Restore Database
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Backup exports every customer, quotation, user, and setting as a JSON file. Restoring
          replaces all current data — this cannot be undone.
        </p>
      </CardContent>

      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
            <DialogDescription>
              This will permanently replace all current data with the contents of the backup file.
              Type <strong>RESTORE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="backup-file">Backup File (.json)</Label>
              <Input
                id="backup-file"
                type="file"
                accept="application/json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Type RESTORE to confirm</Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESTORE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!file || confirmText !== "RESTORE" || restoring}
              onClick={handleRestore}
            >
              {restoring && <Loader2 className="animate-spin" />}
              Restore Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
