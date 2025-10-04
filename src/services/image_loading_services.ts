/**
 * Function that loads all images in the browser to avoid lazy loading.
 */
export async function waitForAllImagesToLoad(): Promise<void> {
  const location = window.location;

  if (location.origin.includes('.craigslist.org')) {
    fetchCraigsListImages();
  }

  const images: HTMLImageElement[] = Array.from(document.querySelectorAll('img'));
  const notLoadedImages = images.filter(img => !img.complete || img.naturalWidth === 0);

  if (notLoadedImages.length === 0) {
    // All images are already loaded
    return;
  }

  await Promise.all(
    notLoadedImages.map(
      img =>
        new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Resolve even if an image fails to load
        })
    )
  );
  // All images have finished loading
}

/**
 * Eagerly loads full-size images on Craigslist by replacing thumbnails.
 */
function fetchCraigsListImages(): void {
  const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('img');
  const thumbnailPattern = /_50x50c\.jpg$/;

  images.forEach((img: HTMLImageElement) => {
    if (thumbnailPattern.test(img.src)) {
      const largeImageSrc = img.src.replace(thumbnailPattern, '_600x450.jpg');
      const testImage = new Image();

      testImage.onload = () => {
        img.src = largeImageSrc;
      };

      testImage.onerror = () => {
        // Optional: handle error if large image is unavailable
      };

      testImage.src = largeImageSrc;
    }
  });
}
