/**
 * Compresses an image file client-side by resizing it and lowering the quality.
 * Returns a data URL (JPEG).
 */
export function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not running in a browser environment, skip compression
    if (typeof window === "undefined" || typeof FileReader === "undefined") {
      reject(new Error("Client-side image compression is not supported in this environment"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context from canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to data URL with specified quality
        try {
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Failed to export canvas to JPEG"));
        }
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
    reader.readAsDataURL(file);
  });
}
