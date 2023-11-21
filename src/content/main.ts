import { PipEventName } from "@/types/pip";
import { copilotNavigateTo, pip } from "./pip";

function handlePipEvent(event: CustomEvent | Event) {
  console.log(event);
  if ("detail" in event) {
    try {
      pip(event.detail);
    } catch (e) {
      console.error(e);
    }
  }
}

function handleLoadDocEvent(event: CustomEvent | Event) {
  if ("detail" in event) {
    copilotNavigateTo(event.detail.url);
  }
}

document.addEventListener(PipEventName.pip, handlePipEvent);
document.addEventListener(PipEventName.loadDoc, handleLoadDocEvent);

window.addEventListener("securitypolicyviolation", (e) => {
  console.warn(e);
  console.log(e.originalPolicy);
});
