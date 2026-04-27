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

type ImageDropzoneProps = {
  value: string | null;
  onChange: (next: string | null) => void;
  folder: UploadFolder;
  initialValue?: string | null;
  initialPreviewUrl?: string | null;
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

export function ImageDropzone({
  value,
  onChange,
  folder,
  initialValue,
  initialPreviewUrl,
  disabled,
  id,
  name,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache of {uploaded path → preview URL} so a fresh value still has a
  // thumbnail without round-tripping through image_url on the resource.
  const sessionPreviews = useRef<Map<string, string>>(new Map());

  const previewSrc = useMemo(() => {
    if (!value) return null;
    const cached = sessionPreviews.current.get(value);
    if (cached) return cached;
    if (/^https?:\/\//i.test(value)) return value;
    if (initialValue && value === initialValue && initialPreviewUrl) {
      return initialPreviewUrl;
    }
    return null;
  }, [value, initialValue, initialPreviewUrl]);

  const handleDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError(null);
      setUploading(true);
      try {
        const res = await uploadImage(file, folder);
        sessionPreviews.current.set(res.path, res.url);
        onChange(res.path);
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
    [folder, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT_MAP,
    multiple: false,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: disabled || uploading,
    onDrop: handleDrop,
    onDropRejected: (rejections) => {
      const first = rejections[0]?.errors[0];
      if (first?.code === "file-too-large") {
        setError(`File is larger than ${MAX_UPLOAD_MB} MB.`);
      } else if (first?.code === "file-invalid-type") {
        setError("Unsupported file type. Use JPEG, PNG, WEBP, or GIF.");
      } else {
        setError(first?.message ?? "File rejected.");
      }
    },
  });

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  if (uploading) {
    return (
      <div className="space-y-2">
        <div className="flex aspect-video w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Uploading…</span>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg border border-input bg-muted">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Selected image preview"
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="size-8" />
              <span className="text-xs">Image attached</span>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove image"
          >
            <XIcon />
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps({
          className: cn(
            "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-transparent px-4 text-center transition-colors",
            "hover:border-ring hover:bg-muted/40",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            isDragActive && "border-ring bg-muted/60",
            disabled && "pointer-events-none opacity-50",
            ariaInvalid &&
              "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
          ),
        })}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <input {...getInputProps({ id, name })} />
        <UploadCloudIcon className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Drop the image here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WEBP, or GIF · up to {MAX_UPLOAD_MB} MB
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
