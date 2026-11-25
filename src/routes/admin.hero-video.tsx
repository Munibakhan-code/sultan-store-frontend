import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud, Video } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, FieldLabel, Panel, ProgressBar } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { notify } from "@/components/common/Toast";
import { useAdminSettings, useUploadHeroVideo } from "@/hooks/useAdmin";
import { getUploadErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/admin/hero-video")({
  component: AdminHeroVideoPage,
});

function AdminHeroVideoPage() {
  const { data, isLoading, isError, error } = useAdminSettings();
  const upload = useUploadHeroVideo();
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(selected: File | null) {
    setFile(selected);
    setLocalPreview(selected ? URL.createObjectURL(selected) : null);
    setPercent(0);
  }

  async function handleUpload() {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      notify.error("File too large", "Hero videos must be 50MB or smaller.");
      return;
    }
    setPercent(0);
    try {
      await upload.mutateAsync({ file, onProgress: setPercent });
      setPercent(100);
      notify.success("Hero video replaced", "The store hero now plays the new clip.");
      pick(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      notify.error("Upload failed", getUploadErrorMessage(err, "Could not upload the video."));
    }
  }

  return (
    <AdminLayout
      title="Hero video"
      description="The store hero plays whatever the backend returns. Uploads go through the backend, never straight to Cloudinary."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Current hero video">
          <DataState
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={!data?.heroVideoUrl}
            emptyTitle="No hero video set"
            emptyDescription="The store falls back to its cinematic gradient hero until you upload one."
            emptyIcon={<Video className="h-6 w-6" />}
            errorFallback="Could not load settings."
            skeletonRows={2}
          >
            <video
              key={data?.heroVideoUrl ?? "current"}
              src={data?.heroVideoUrl ?? undefined}
              controls
              muted
              loop
              playsInline
              className="w-full rounded-md border border-border bg-black"
            />
            <p className="mt-2 break-all text-xs text-muted-foreground">{data?.heroVideoUrl}</p>
          </DataState>
        </Panel>

        <Panel title="Replace video">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Select a video file</FieldLabel>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-primary"
              />
            </div>

            {localPreview ? (
              <video
                src={localPreview}
                controls
                muted
                loop
                playsInline
                className="w-full rounded-md border border-border bg-black"
              />
            ) : null}

            {upload.isPending || percent > 0 ? (
              <div className="space-y-1 rounded-md border border-border bg-surface p-3">
                <ProgressBar
                  value={percent}
                  label={percent >= 100 ? "Processing on the server…" : "Uploading video"}
                />
                <p className="text-xs text-muted-foreground">
                  {percent >= 100
                    ? "Large clips can take a while to finish encoding."
                    : "Keep this page open until the upload completes."}
                </p>
              </div>
            ) : null}

            <Button onClick={handleUpload} disabled={!file} isLoading={upload.isPending} full>
              <UploadCloud className="h-4 w-4" />
              Upload & replace
            </Button>
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
