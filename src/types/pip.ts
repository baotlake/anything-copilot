export type PipOptions = {
  url: string;
  selector?: string[];
  mode: "iframe" | "write-html" | "move-element";
  isCopyStyle?: boolean;
};
