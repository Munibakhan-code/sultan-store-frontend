import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Picks a payment screenshot and previews it locally. The file is handed to the
 * backend (which uploads to Cloudinary) — no cloud credentials in the browser.
 */
export function ScreenshotUploader({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleSelect(selected: File | undefined) {
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      setError("Please upload a PNG, JPG or WebP image.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Screenshot must be smaller than 5MB.");
      return;
    }
    setError(null);
    onChange(selected);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Payment screenshot
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(event) => handleSelect(event.target.files?.[0])}
      />

      {preview ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          <img src={preview} alt="Payment screenshot preview" className="max-h-80 w-full object-contain" />
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">{file?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-2 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center transition-colors hover:border-primary/60",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <ImageUp className="h-7 w-7 text-primary" />
          <span className="font-display text-sm font-bold uppercase text-foreground">
            Upload screenshot
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG or WebP — up to 5MB</span>
        </button>
      )}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
