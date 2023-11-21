export type PipOptions = {
  url: string;
  selector?: string[];
  mode: "iframe" | "write-html" | "move-element";
  isCopyStyle?: boolean;
};

export enum PipEventName {
  pip = "anything-copilot-pip",
  loaded = "anything-copilot-loaded",
  loadDoc = "anything-copilot-load-doc",
}
