/// <reference types="vite/client" />

interface PdfjsLib {
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<any> };
  GlobalWorkerOptions: { workerSrc: string };
}

interface Window {
  pdfjsLib: PdfjsLib;
}
