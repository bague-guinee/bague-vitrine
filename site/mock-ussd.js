"use strict";
// Démonstration hors ligne pour GitHub Pages : reproduit dans le navigateur les menus *123#
// du serveur (app/services/ussd_service.py), avec des données fictives. Rien n'est envoyé.
(() => {
  const ANIMALS = {
    "+224622000002": {
      first: "Alpha",
      animals: [
        { code: "BG-QDX2QMT9", name: "Dalla", breed: "N'Dama", coat: "Fauve", status: "active" },
        { code: "BG-7K3MQ9XA", name: null, breed: "Zébu peul", coat: "Blanche", status: "active" },
      ],
    },
    "+224622000003": {
      first: "Fatoumata",
      animals: [{ code: "BG-M4PZ81RC", name: "Bobo", breed: "Métis", coat: "Pie noire", status: "active" }],
    },
  };
  const LABELS = { active: "actif", stolen: "signalé volé" };
  const MAX_ITEMS = 6;

  const normalizePhone = (raw) => {
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length === 9) return "+224" + digits;
    if (digits.startsWith("224") && digits.length === 12) return "+" + digits;
    return "+" + digits;
  };
  const normalizeCode = (raw) => {
    let compact = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (compact.startsWith("BG")) compact = compact.slice(2);
    return "BG-" + compact;
  };
  const label = (a) => `${a.code}${a.name ? " « " + a.name + " »" : ""} ${a.breed}, ${a.coat}`;
  const allAnimals = () => Object.values(ANIMALS).flatMap((f) => f.animals);
  const cont = (message) => ({ message, end: false });
  const end = (message) => ({ message, end: true });

  function theft(farmer, steps) {
    const active = farmer.animals.filter((a) => a.status === "active").slice(0, MAX_ITEMS);
    if (!active.length) return end("Aucun animal actif à votre nom.");
    if (steps.length === 1) return cont("Quel animal a été volé ?\n" + active.map((a, i) => `${i + 1}. ${label(a)}`).join("\n"));
    const animal = active[Number(steps[1]) - 1];
    if (!animal) return end("Choix invalide. Recomposez le code.");
    if (steps.length === 2) return cont(`Signaler le vol de ${animal.code} ?\n1. Oui, signaler le vol\n2. Non, annuler`);
    if (steps[2] !== "1") return end("Signalement annulé.");
    animal.status = "stolen";
    const folder = Math.random().toString(16).slice(2, 10).toUpperCase();
    return end(`Vol signalé. Dossier n° ${folder}.\n${animal.code} est en alerte dans tout le registre. Vous serez prévenu par SMS s'il est retrouvé.`);
  }

  function check(steps) {
    if (steps.length === 1) return cont("Entrez le code de l'animal (ex. BG-7K3MQ9XA) :");
    const code = normalizeCode(steps[1]);
    const animal = allAnimals().find((a) => a.code === code);
    if (!animal) return end(`${code} : inconnu dans le registre BAGUÉ.`);
    if (animal.status === "stolen") return end(`ATTENTION : ${code} est signalé volé. Ne l'achetez pas, prévenez la gendarmerie.`);
    return end(`${code} : enregistré, actif, aucun signalement.`);
  }

  function recovered(farmer, steps) {
    const stolen = farmer.animals.filter((a) => a.status === "stolen").slice(0, MAX_ITEMS);
    if (!stolen.length) return end("Aucun de vos animaux n'est en alerte.");
    if (steps.length === 1) return cont("Quel animal avez-vous retrouvé ?\n" + stolen.map((a, i) => `${i + 1}. ${a.code}`).join("\n"));
    const animal = stolen[Number(steps[1]) - 1];
    if (!animal) return end("Choix invalide. Recomposez le code.");
    animal.status = "active";
    return end(`Merci. ${animal.code} n'est plus en alerte.`);
  }

  function handle(phone, text) {
    const farmer = ANIMALS[normalizePhone(phone)];
    if (!farmer) return end("Numéro non enregistré. Présentez-vous au guichet BAGUÉ de votre sous-préfecture.");
    const steps = text.trim() ? text.split("*").map((s) => s.trim()) : [];
    if (!steps.length) return cont(`BAGUÉ — Bonjour ${farmer.first}\n1. Signaler un vol\n2. Mes animaux\n3. Vérifier un animal\n4. Animal retrouvé`);
    if (steps[0] === "1") return theft(farmer, steps);
    if (steps[0] === "2") return end("Vos animaux :\n" + farmer.animals.map((a) => `${a.code} : ${LABELS[a.status]}`).join("\n"));
    if (steps[0] === "3") return check(steps);
    if (steps[0] === "4") return recovered(farmer, steps);
    return end("Choix invalide. Recomposez le code.");
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    if (typeof url === "string" && url.endsWith("/demo/ussd")) {
      const body = JSON.parse(options.body || "{}");
      await new Promise((resolve) => setTimeout(resolve, 350)); // délai d'un vrai réseau USSD
      return new Response(JSON.stringify(handle(body.phone || "", body.text || "")), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return realFetch(url, options);
  };
})();
