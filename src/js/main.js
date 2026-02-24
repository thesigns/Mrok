import { Game } from "./game.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

const installScreen = document.querySelector("#install-screen");
const installBtn = document.querySelector("#install-btn");
const main = document.querySelector("main");
let deferredPrompt = null;

function startGame() {
  installScreen.hidden = true;
  main.hidden = false;
  const canvas = document.querySelector("canvas");
  new Game(canvas);
}

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

  // Fallback: if beforeinstallprompt doesn't fire (e.g. Firefox, Safari),
  // start the game anyway after a short delay
  setTimeout(() => {
    if (!deferredPrompt && main.hidden) {
      startGame();
    }
  }, 1500);
}
