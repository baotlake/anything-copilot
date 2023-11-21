/// <reference types="vite/client" />

interface DocumentPictureInPicture extends EventTarget {
  window: Window | null;
  requestWindow(option?: { width?: number; height?: number }): Promise<Window>;
}

export declare global {
  interface documentPictureInPicture extends DocumentPictureInPicture {}

  interface Window {
    documentPictureInPicture: DocumentPictureInPicture;
    trustedTypes: any;
  }

  interface Navigator {
    userAgentData: {
      platform: string;
    };
  }
}

export {};
