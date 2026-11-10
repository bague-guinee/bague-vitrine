"use strict";

(() => {
  const api = document.querySelector('meta[name="bague-api"]').content;
  const serviceCode = document.querySelector('meta[name="bague-service-code"]').content;
  const lcd = document.getElementById("lcd");
  const screen = document.getElementById("screen");
  const typedEl = document.getElementById("typed");
  const softLeft = document.getElementById("soft-left");
  const callKey = document.getElementById("call-key");
  const phoneInput = document.getElementById("phone");
  const journal = document.getElementById("journal");
  const clock = document.getElementById("clock");
  const MAX_INPUT = 24;

  // idle : composer le code ; session : menu ouvert ; waiting : réponse attendue ; ended : message final
  let state = "idle";
  let path = [];
  let typed = "";

  const IDLE_TEXT = "Composez " + serviceCode + "\npuis Appeler.";

  function render(text) {
    if (text !== undefined) screen.textContent = text;
    typedEl.textContent = typed;
    lcd.dataset.state = state;
    const label = state === "idle" ? "Appeler" : state === "ended" ? "OK" : "Envoyer";
    softLeft.textContent = label;
    callKey.textContent = label;
  }

  function reset() {
    state = "idle";
    path = [];
    typed = "";
    render(IDLE_TEXT);
  }

  function log(sent, received) {
    const empty = journal.querySelector(".empty");
    if (empty) empty.remove();
    const item = document.createElement("li");
    const left = document.createElement("span");
    left.className = "sent";
    left.textContent = sent;
    const right = document.createElement("span");
    right.className = "got";
    right.textContent = received;
    item.append(left, right);
    journal.prepend(item);
  }

  async function exchange(steps) {
    state = "waiting";
    typed = "";
    render("Connexion…");
    const text = steps.join("*");
    try {
      const response = await fetch(api + "/demo/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.value.trim(), text }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body === null) {
        const reason = body && body.error ? body.error.message : "Service indisponible (" + response.status + ").";
        state = "ended";
        render(reason);
        log(text || serviceCode, reason);
        return;
      }
      path = steps;
      state = body.end ? "ended" : "session";
      render(body.message);
      log(text || serviceCode, (body.end ? "END " : "CON ") + body.message);
    } catch (error) {
      state = "ended";
      render("Pas de réseau. Vérifiez que le serveur BAGUÉ est démarré.");
      log(text || serviceCode, String(error));
    }
  }

  function send() {
    if (state === "waiting") return;
    if (state === "ended") return reset();
    if (state === "idle") {
      if (typed !== serviceCode) {
        typed = "";
        render("Code inconnu.\nComposez " + serviceCode + ".");
        return;
      }
      return exchange([]);
    }
    if (typed === "") return;
    exchange(path.concat([typed]));
  }

  function press(key) {
    if (state === "waiting" || state === "ended") return;
    if (typed.length >= MAX_INPUT) return;
    if (state === "session" && (key === "*" || key === "#")) return; // séparateur réservé au protocole
    if (state === "idle" && /[a-z]/i.test(key)) return;
    typed += key.toUpperCase();
    render();
  }

  function back() {
    if (state === "ended") return reset();
    typed = typed.slice(0, -1);
    render();
  }

  document.getElementById("keys").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.key) press(button.dataset.key);
    else if (button.dataset.action === "send") send();
    else if (button.dataset.action === "back") back();
    else if (button.dataset.action === "hangup") reset();
  });

  document.addEventListener("keydown", (event) => {
    if (event.target === phoneInput) return;
    if (/^[0-9a-zA-Z*#]$/.test(event.key)) press(event.key); // lettres : saisie d'un code BG-…
    else if (event.key === "Enter") send();
    else if (event.key === "Backspace") back();
    else if (event.key === "Escape") reset();
    else return;
    event.preventDefault();
  });

  phoneInput.addEventListener("change", reset);

  function tick() {
    clock.textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  tick();
  setInterval(tick, 15000);
  reset();
})();
