export class Infobox {
  constructor(element) {
    this.el = element;
    this.timer = null;
  }

  hide() {
    clearTimeout(this.timer);
    this.el.style.opacity = "0";
    this.el.classList.remove("orange");
  }

  show(text) {
    this.el.textContent = text;
    this.el.style.opacity = "1";
    this.el.classList.remove("orange");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.el.style.opacity = "0";
    }, 4000);
  }

  showPersistent(text) {
    this.el.textContent = text;
    this.el.style.opacity = "1";
    this.el.classList.add("orange");
    clearTimeout(this.timer);
  }
}
