import { pip, pipEventName } from "./pip";

function handleEvent(event: any) {
  console.log(event);
  try {
    pip(event.detail);
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener(pipEventName, handleEvent);

window.addEventListener("securitypolicyviolation", (e) => {
  console.warn(e);
  console.log(e.originalPolicy);
});
