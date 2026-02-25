import { Game } from "./game.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

const menuScreen = document.querySelector("#menu-screen");
const gameScreen = document.querySelector("#game-screen");
const btnMenu = document.querySelector("#btn-menu");
const btnBack = document.querySelector("#btn-back");
const btnQuit = document.querySelector("#btn-quit");
const btnInstall = document.querySelector("#btn-install");
const main = document.querySelector("main");
let deferredPrompt = null;

document.addEventListener("contextmenu", (e) => e.preventDefault());

function scaleLayout() {
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;
  const scale = Math.min(w / 800, h / 360);
  main.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

scaleLayout();
window.addEventListener("resize", scaleLayout);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", scaleLayout);
}
setTimeout(scaleLayout, 100);
setTimeout(scaleLayout, 500);

const canvas = document.querySelector(".viewport-wrap > canvas");
new Game(canvas);

btnMenu.addEventListener("click", () => {
  gameScreen.hidden = true;
  menuScreen.hidden = false;
});

btnBack.addEventListener("click", () => {
  menuScreen.hidden = true;
  gameScreen.hidden = false;
});

btnQuit.addEventListener("click", () => {
  window.close();
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.hidden = false;
});

btnInstall.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  btnInstall.hidden = true;
});
