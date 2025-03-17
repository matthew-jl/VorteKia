// components/CloudinaryUploader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CloudinaryUploaderProps {
  imageUrl?: string;
  onImageChange: (url: string | undefined) => void;
  folder?: string;
  aspectRatio?: number; // optional aspect ratio for cropping
  className?: string;
}

export function CloudinaryUploader({
  imageUrl,
  onImageChange,
  folder = "uploads",
  aspectRatio,
  className = "h-48",
}: CloudinaryUploaderProps) {
  const openUploadWidget = () => {
    window.cloudinary.openUploadWidget(
      {
        cloudName: "dbllc6nd9", // Replace with your Cloudinary cloud name
        uploadPreset: "vortekia_app_uploads",
        folder: folder,
        sources: ["local"],
        multiple: false,
        cropping: true,
        ...(aspectRatio && { cropping_aspect_ratio: aspectRatio }),
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          onImageChange(url);
          console.log("Uploaded photo URL:", url);
        } else if (error) {
          console.error("Upload error:", error);
        }
      }
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {imageUrl ? (
        <div className="relative group h-full">
          <div className="overflow-hidden rounded-md border border-primary/20 bg-background/50 backdrop-blur-sm h-full">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover transition-all"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-md">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onImageChange(undefined)}
              className="bg-background/80 hover:bg-background"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={openUploadWidget}
          className="flex flex-col items-center justify-center h-full rounded-md border border-dashed border-primary/40 bg-background/50 backdrop-blur-sm hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
            <div className="p-2 rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Upload photo
              </p>
              <p className="text-xs text-muted-foreground">
                Click to upload an image
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
