/**
 * Function that loads all images in the browser to avoid lazy loading.
 */
import { debug } from './logger_services';
import { IRapport } from '../types';
import { DOMElement } from 'react';

export async function waitForAllImagesToLoad(): Promise<void> {
  const location = window.location;

  if (location.origin.includes('.craigslist.org')) {
    fetchCraigsListImages();
  }

  const images: HTMLImageElement[] = Array.from(
    document.querySelectorAll('img')
  );
  const notLoadedImages = images.filter(
    (img) => !img.complete || img.naturalWidth === 0
  );

  if (notLoadedImages.length === 0) {
    // All images are already loaded
    return;
  }

  await Promise.all(
    notLoadedImages.map(
      (img) =>
        new Promise<void>((resolve) => {
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

export async function fetchBlob(url: string): Promise<Blob | null> {
  if (url.startsWith('blob:http')) {
    debug(`Bad media URL ${url}`);
    //Badge.setBgColorAndText('red', 'X')
    //setTimeout(() => { Badge.setDefault() }, 1500)
    return null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      debug(`Error when getting data ${await response.text()}`);
      //Badge.setBgColorAndText('red', 'X')
      return null;
    }

    //collect the blob
    const blob = await response.blob();
    return blob;
  } catch (e) {
    debug(String(e), { url });
  }
  return null;
}

/**
 * Concatenate several images together
 * @param rapports
 */
export async function mergeImagesVertically(
  rapports: Array<IRapport>
): Promise<string> {
  const images = [];
  let totalHeight = 0;
  let maxWidth = 0;

  // Load all images and gather dimensions, that have a screenshot
  for (const rapport of rapports.filter((r) => r.screenshot)) {
    const img = new Image();
    img.src = rapport.screenshot;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    images.push(img);
    totalHeight += img.height;
    maxWidth = Math.max(maxWidth, img.width);
  }

  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas.');
  }

  let currentY = 0;
  for (const img of images) {
    ctx.drawImage(img, 0, currentY);
    currentY += img.height;
  }

  // Return the merged image as a data URL
  return canvas.toDataURL('image/png');
}
