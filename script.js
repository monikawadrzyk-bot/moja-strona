document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const toggle = document.querySelector(".navbar__toggle");
  const menu = document.querySelector(".navbar__links");
  const links = document.querySelectorAll(".navbar__links a");

  // Rok w stopce
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Menu mobilne
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen);
    toggle.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otwórz menu");
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Otwórz menu");
    });
  });

  // Obramowanie navbara po przewinięciu
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Podświetlanie aktywnej sekcji w menu
  const sections = ["home", "o-mnie", "uslugi", "portfolio", "blog", "kontakt"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((section) => sectionObserver.observe(section));

  // Stopka może być za niska, by trafić w środek ekranu — obsłuż dół strony
  window.addEventListener(
    "scroll",
    () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      if (atBottom && sections.length) setActive("kontakt");
    },
    { passive: true }
  );

  // Animacja pojawiania się kart
  const cards = document.querySelectorAll(".card, .post, .service");
  cards.forEach((card) => card.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  cards.forEach((card) => revealObserver.observe(card));

  // Formularz kontaktowy z walidacją
  const form = document.getElementById("contact-form");
  if (form) {
    const status = document.getElementById("cf-status");
    const message = form.elements.message;
    const counter = document.getElementById("cf-message-count");
    const submitBtn = form.querySelector(".form__submit");

    const validators = {
      name: (v) => (v.trim().length >= 2 ? "" : "Podaj imię (min. 2 znaki)."),
      email: (v) => {
        if (!v.trim()) return "Podaj adres e-mail.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Podaj poprawny adres e-mail.";
      },
      topic: (v) => (v ? "" : "Wybierz temat wiadomości."),
      message: (v) => (v.trim().length >= 10 ? "" : "Wiadomość powinna mieć co najmniej 10 znaków."),
      consent: (_, field) => (field.checked ? "" : "Zgoda jest wymagana, żebym mogła odpowiedzieć."),
    };

    const validateField = (field) => {
      const error = validators[field.name](field.value, field);
      field.setAttribute("aria-invalid", error ? "true" : "false");
      document.getElementById(`${field.id}-error`).textContent = error;
      return !error;
    };

    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      // Błąd pokazujemy po opuszczeniu pola, a potem aktualizujemy na bieżąco
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener(field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    message.addEventListener("input", () => {
      counter.textContent = `${message.value.length} / ${message.maxLength}`;
    });

    const setStatus = (text, type) => {
      status.textContent = text;
      status.className = `form__status form__status--${type}`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = Object.keys(validators).map((name) => form.elements[name]);
      const results = fields.map(validateField);
      const firstInvalid = fields[results.indexOf(false)];
      if (firstInvalid) {
        firstInvalid.focus();
        setStatus("Popraw zaznaczone pola.", "error");
        return;
      }

      // Adres usługi do wysyłki (np. Formspree) ustawia się w atrybucie data-endpoint formularza
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        setStatus("Dziękuję! Formularz działa w trybie demo — wiadomość nie została wysłana.", "success");
        form.reset();
        counter.textContent = `0 / ${message.maxLength}`;
        return;
      }

      submitBtn.disabled = true;
      setStatus("Wysyłanie…", "success");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(res.statusText);
        setStatus("Dziękuję! Wiadomość została wysłana — odezwę się wkrótce.", "success");
        form.reset();
        counter.textContent = `0 / ${message.maxLength}`;
      } catch {
        setStatus("Nie udało się wysłać wiadomości. Spróbuj ponownie później.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
