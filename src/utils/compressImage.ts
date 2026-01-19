/**
 * Compresses an image file using the browser's Canvas API.
 * 
 * @param file - The original image file.
 * @param maxWidth - The maximum width of the output image.
 * @param quality - The quality of the output image (0 to 1).
 * @returns A Promise that resolves to the compressed Blob/File.
 */
export const compressImage = async (
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Create an image element to load the file
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // 2. Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // 3. Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 4. Convert to Blob (WebP is smaller and widely supported)
      // Fallback to jpeg if webp isn't supported, though most modern browsers support webp
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          
          // 5. Create a new File object
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
          
          // Cleanup
          URL.revokeObjectURL(img.src);
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
  });
};
