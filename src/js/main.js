import { Game } from "./game.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

const installScreen = document.querySelector("#install-screen");
const installedScreen = document.querySelector("#installed-screen");
const menuScreen = document.querySelector("#menu-screen");
const gameScreen = document.querySelector("#game-screen");
const installBtn = document.querySelector("#install-btn");
const btnMenu = document.querySelector("#btn-menu");
const btnBack = document.querySelector("#btn-back");
const btnQuit = document.querySelector("#btn-quit");
const main = document.querySelector("main");
let deferredPrompt = null;

document.addEventListener("contextmenu", (e) => e.preventDefault());

function scaleLayout() {
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 360);
  main.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

scaleLayout();
window.addEventListener("resize", scaleLayout);

function startGame() {
  installScreen.hidden = true;
  installedScreen.hidden = true;
  gameScreen.hidden = false;
  const canvas = document.querySelector(".viewport-wrap > canvas");
  new Game(canvas);
}

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

const isInstalled = window.matchMedia("(display-mode: fullscreen)").matches
  || window.matchMedia("(display-mode: standalone)").matches;

if (isInstalled) {
  startGame();
} else {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installScreen.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === "accepted") {
      startGame();
    }
  });

  // If beforeinstallprompt doesn't fire (app already installed, or
  // browser doesn't support it), show the installed/manual-install screen
  setTimeout(() => {
    if (!deferredPrompt && gameScreen.hidden) {
      installedScreen.hidden = false;
    }
  }, 1500);
}
