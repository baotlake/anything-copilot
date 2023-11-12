/// <reference types="vite/client" />

interface DocumentPictureInPicture {
  window: Window | null;
  requestWindow(option?: { width?: number; height?: number }): Promise<Window>;
}

export declare global {
  interface documentPictureInPicture extends DocumentPictureInPicture {}
  interface Window {
    documentPictureInPicture: DocumentPictureInPicture;
    trustedTypes: any
  }

}

export {};
