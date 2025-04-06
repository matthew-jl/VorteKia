// cloudinary.d.ts
export interface Cloudinary {
  openUploadWidget: (
    options: {
      cloudName: string;
      uploadPreset: string;
      folder?: string;
      sources?: string[];
      multiple?: boolean;
      cropping?: boolean;
    },
    callback: (error: any, result: any) => void
  ) => void;
}

declare global {
  interface Window {
    cloudinary: Cloudinary;
  }
}

export {};
