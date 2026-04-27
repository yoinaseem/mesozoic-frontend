"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import {
  ACCEPTED_IMAGE_MIME,
  describeUploadError,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  uploadImage,
  type UploadFolder,
} from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

type ImageDropzoneMultiProps = {
  value: string[];
  onChange: (next: string[]) => void;
  folder: UploadFolder;
  initialValue?: string[];
  initialPreviewUrls?: string[];
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

const ACCEPT_MAP: Record<string, string[]> = ACCEPTED_IMAGE_MIME.reduce<
  Record<string, string[]>
>((acc, mime) => {
  acc[mime] = [];
  return acc;
}, {});

export function ImageDropzoneMulti({
  value,
  onChange,
  folder,
  initialValue,
  initialPreviewUrls,
  disabled,
  id,
  name,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ImageDropzoneMultiProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionPreviews = useRef<Map<string, string>>(new Map());

  const initialMap = useMemo(() => {
    const map = new Map<string, string>();
    if (initialValue && initialPreviewUrls) {
      const len = Math.min(initialValue.length, initialPreviewUrls.length);
      for (let i = 0; i < len; i += 1) {
        map.set(initialValue[i], initialPreviewUrls[i]);
      }
    }
    return map;
  }, [initialValue, initialPreviewUrls]);

  const resolvePreview = useCallback(
    (entry: string): string | null => {
      const cached = sessionPreviews.current.get(entry);
      if (cached) return cached;
      if (/^https?:\/\//i.test(entry)) return entry;
      const initial = initialMap.get(entry);
      if (initial) return initial;
      return null;
    },
    [initialMap],
  );

  const handleDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);
      setUploading(true);
      try {
        const results = await Promise.all(
          files.map((file) => uploadImage(file, folder)),
        );
        results.forEach((res) => sessionPreviews.current.set(res.path, res.url));
        onChange([...value, ...results.map((r) => r.path)]);
      } catch (err) {
        if (err instanceof ApiError) {
          console.error("Upload failed", err.status, err.data);
        } else {
          console.error("Upload failed", err);
        }
        setError(describeUploadError(err));
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT_MAP,
    multiple: true,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: disabled || uploading,
    onDrop: handleDrop,
    onDropRejected: (rejections) => {
      const first = rejections[0]?.errors[0];
      if (first?.code === "file-too-large") {
        setError(`One or more files are larger than ${MAX_UPLOAD_MB} MB.`);
      } else if (first?.code === "file-invalid-type") {
        setError("Unsupported file type. Use JPEG, PNG, WEBP, or GIF.");
      } else {
        setError(first?.message ?? "File rejected.");
      }
    },
  });

  const removeAt = (index: number) => {
    setError(null);
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((entry, index) => {
            const src = resolvePreview(entry);
            return (
              <div
                key={`${entry}-${index}`}
                className="relative overflow-hidden rounded-lg border border-input bg-muted"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`Image ${index + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    <ImageIcon className="size-6" />
                    <span className="text-xs">Image attached</span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-1.5 right-1.5"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove image ${index + 1}`}
                >
                  <XIcon />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        {...getRootProps({
          className: cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-transparent px-4 py-6 text-center transition-colors",
            "hover:border-ring hover:bg-muted/40",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            isDragActive && "border-ring bg-muted/60",
            (disabled || uploading) && "pointer-events-none opacity-60",
            ariaInvalid &&
              "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
          ),
        })}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <input {...getInputProps({ id, name })} />
        {uploading ? (
          <>
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <UploadCloudIcon className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {isDragActive
                ? "Drop the images here"
                : value.length > 0
                  ? "Drag & drop or click to add more"
                  : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WEBP, or GIF · up to {MAX_UPLOAD_MB} MB each
            </p>
          </>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
