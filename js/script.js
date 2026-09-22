/* ==========================================================================
   Abhina Rose — Portfolio interactions
   --------------------------------------------------------------------------
   1. Helpers
   2. Mobile menu
   3. Navigation indicator + scroll spy
   4. Scroll loop (navbar, progress bar, parallax, timeline, back-to-top)
   5. Scroll reveal + stagger
   6. Animated counters
   7. Pointer effects (spotlight, hero parallax, magnetic buttons)
   8. Hero photo loading state
   9. Contact form
   ========================================================================== */
(() => {
    "use strict";

    /* 1. HELPERS ========================================================== */

    const root = document.documentElement;
    root.classList.add("js");

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mobileNav = window.matchMedia("(max-width: 900px)");

    const navbar = $("#navbar");
    const menuBtn = $("#menuBtn");
    const navLinks = $("#navLinks");
    const navIndicator = $("#navIndicator");
    const navLinkEls = $$(".nav-link");
    const progressBar = $("#scrollProgress");
    const toTop = $("#toTop");
    const contactForm = $("#contactForm");
    const formStatus = $("#formStatus");


    /* 2. MOBILE MENU ====================================================== */

    function setMenu(open) {
        if (!menuBtn || !navLinks) return;
        navLinks.classList.toggle("open", open);
        menuBtn.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    }

    if (menuBtn && navLinks) {
        // Index used to stagger the links when the menu opens
        $$("a", navLinks).forEach((link, i) => link.style.setProperty("--n", i));

        menuBtn.addEventListener("click", () => {
            setMenu(!navLinks.classList.contains("open"));
        });

        // Close after choosing a link
        $$(".nav-links a").forEach(link => {
            link.addEventListener("click", () => setMenu(false));
        });

        // Close on outside click, Escape, or when leaving the mobile layout
        document.addEventListener("click", event => {
            if (navLinks.classList.contains("open") && !navbar.contains(event.target)) {
                setMenu(false);
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") setMenu(false);
        });

        const onBreakpoint = () => setMenu(false);
        if (mobileNav.addEventListener) mobileNav.addEventListener("change", onBreakpoint);
        else mobileNav.addListener(onBreakpoint);
    }


    /* 3. NAVIGATION INDICATOR + SCROLL SPY ================================ */

    let activeLink = $(".nav-link.active") || navLinkEls[0] || null;
    let hoveringNav = false;
    let indicatorPlaced = false;

    function placeIndicator(link) {
        if (!navIndicator) return;

        if (!link || mobileNav.matches) {
            navIndicator.style.setProperty("--o", "0");
            return;
        }

        // First placement should appear in position, not slide in from the left
        const instant = !indicatorPlaced;
        if (instant) navIndicator.classList.add("no-anim");

        navIndicator.style.setProperty("--x", link.offsetLeft + "px");
        navIndicator.style.setProperty("--w", link.offsetWidth + "px");
        navIndicator.style.setProperty("--o", "1");

        if (instant) {
            void navIndicator.offsetWidth; // flush styles
            navIndicator.classList.remove("no-anim");
            indicatorPlaced = true;
        }
    }

    function setActiveLink(link) {
        if (link === activeLink) return;

        navLinkEls.forEach(el => {
            const isActive = el === link;
            el.classList.toggle("active", isActive);
            if (isActive) el.setAttribute("aria-current", "true");
            else el.removeAttribute("aria-current");
        });

        activeLink = link;
        if (!hoveringNav) placeIndicator(activeLink);
    }

    if (navLinks && navIndicator) {
        navLinkEls.forEach(link => {
            const preview = () => {
                hoveringNav = true;
                placeIndicator(link);
            };
            if (finePointer) link.addEventListener("mouseenter", preview);
            link.addEventListener("focus", () => {
                if (link.matches(":focus-visible")) preview();
            });
        });

        const reset = () => {
            hoveringNav = false;
            placeIndicator(activeLink);
        };

        navLinks.addEventListener("mouseleave", reset);
        navLinks.addEventListener("focusout", event => {
            if (!navLinks.contains(event.relatedTarget)) reset();
        });

        const cta = $(".nav-contact", navLinks);
        if (cta) cta.addEventListener("mouseenter", reset);

        window.addEventListener("resize", () => placeIndicator(hoveringNav ? null : activeLink));
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => placeIndicator(activeLink));
        }
        placeIndicator(activeLink);
    }

    // Every page section, in order. Sections without a nav link
    // (achievements, resume, contact) simply clear the highlight.
    const spySections = $$("main > section[id]");


    /* 4. SCROLL LOOP ====================================================== */

    const parallaxEls = $$("[data-scroll-speed]");
    const timeline = $(".timeline");
    const timelineItems = $$(".experience-item");
    let ticking = false;

    function update() {
        ticking = false;

        const y = window.scrollY;
        const viewport = window.innerHeight;
        const maxScroll = document.documentElement.scrollHeight - viewport;

        // Navbar state
        if (navbar) navbar.classList.toggle("scrolled", y > 30);

        // Reading progress
        if (progressBar) {
            const progress = maxScroll > 0 ? clamp(y / maxScroll, 0, 1) : 0;
            progressBar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
        }

        // Back to top
        if (toTop) toTop.classList.toggle("show", y > 700);

        // Scroll spy
        if (spySections.length) {
            const line = viewport * 0.35;
            let current = spySections[0];
            spySections.forEach(section => {
                if (section.getBoundingClientRect().top <= line) current = section;
            });
            if (maxScroll > 0 && y >= maxScroll - 4) {
                current = spySections[spySections.length - 1];
            }
            const link = navLinkEls.find(el => el.getAttribute("href") === "#" + current.id) || null;
            setActiveLink(link);
        }

        // Hero background parallax (only while the hero is on screen)
        if (!reduceMotion && y < viewport * 1.5) {
            parallaxEls.forEach(el => {
                const speed = parseFloat(el.dataset.scrollSpeed) || 0;
                el.style.translate = "0 " + (y * speed).toFixed(1) + "px";
            });
        }

        // Experience timeline: fill the line and light up reached dots
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const trigger = viewport * 0.7;
            const fill = clamp((trigger - rect.top - 6) / Math.max(rect.height - 12, 1), 0, 1);
            timeline.style.setProperty("--progress", fill.toFixed(3));
            timelineItems.forEach(item => {
                item.classList.toggle("is-active", item.getBoundingClientRect().top < trigger);
            });
        }
    }

    function requestUpdate() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    update();

    if (toTop) {
        toTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }


    /* 5. SCROLL REVEAL + STAGGER ========================================== */

    // Cards inside a [data-stagger] container enter one after another
    $$("[data-stagger]").forEach(parent => {
        $$(":scope > .reveal", parent).forEach((el, i) => el.style.setProperty("--i", i));
    });

    // Chips inside a revealed card pop in sequentially
    $$(".tags, .skill-list").forEach(list => {
        Array.from(list.children).forEach((chip, i) => chip.style.setProperty("--i", i));
    });

    const revealEls = $$(".reveal");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );
        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add("visible"));
    }


    /* 6. ANIMATED COUNTERS ================================================ */

    const counters = $$(".counter");

    function runCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        if (Number.isNaN(target)) return;

        const duration = 1600;
        const start = performance.now();

        (function tick(now) {
            const t = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - t, 4); // ease-out quart
            el.textContent = Math.round(target * eased);
            if (t < 1) window.requestAnimationFrame(tick);
        })(start);
    }

    if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
        counters.forEach(el => { el.textContent = "0"; });

        const counterObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    runCounter(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.6 }
        );
        counters.forEach(el => counterObserver.observe(el));
    }


    /* 7. POINTER EFFECTS ================================================== */

    if (finePointer) {
        // Cursor-following highlight on cards (any element with data-spotlight,
        // including the contact-info panel)
        $$("[data-spotlight]").forEach(card => {
            card.addEventListener("pointermove", event => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mx", event.clientX - rect.left + "px");
                card.style.setProperty("--my", event.clientY - rect.top + "px");
            });
        });

        if (!reduceMotion) {
            // Hero: decorative layers drift with the cursor
            const hero = $("#home");
            const depthEls = $$("[data-depth]");

            if (hero && depthEls.length) {
                hero.addEventListener("pointermove", event => {
                    const rect = hero.getBoundingClientRect();
                    const x = (event.clientX - rect.left) / rect.width - 0.5;
                    const y = (event.clientY - rect.top) / rect.height - 0.5;
                    depthEls.forEach(el => {
                        const depth = parseFloat(el.dataset.depth) || 0;
                        el.style.translate = (x * depth).toFixed(1) + "px " + (y * depth).toFixed(1) + "px";
                    });
                });

                hero.addEventListener("pointerleave", () => {
                    depthEls.forEach(el => { el.style.translate = "0 0"; });
                });
            }

            // Primary buttons lean slightly toward the cursor
            $$(".btn-magnetic").forEach(btn => {
                btn.addEventListener("pointermove", event => {
                    const rect = btn.getBoundingClientRect();
                    const dx = event.clientX - (rect.left + rect.width / 2);
                    const dy = event.clientY - (rect.top + rect.height / 2);
                    btn.style.translate = dx * 0.16 + "px " + dy * 0.24 + "px";
                });
                btn.addEventListener("pointerleave", () => { btn.style.translate = "0 0"; });
            });
        }
    }


    /* 8. HERO PHOTO LOADING STATE ========================================= */

    const photoFrame = $("#photoFrame");
    const photo = $(".profile-photo");

    if (photoFrame && photo) {
        const onLoaded = () => photoFrame.classList.add("is-loaded");
        const onFailed = () => photoFrame.classList.add("is-empty");

        if (photo.complete) {
            if (photo.naturalWidth > 0) onLoaded();
            else onFailed();
        } else {
            photo.addEventListener("load", onLoaded, { once: true });
            photo.addEventListener("error", onFailed, { once: true });
        }
    }


    /* 9. CONTACT FORM ===================================================== */

    if (contactForm && formStatus) {
        const fields = $$("input, textarea", contactForm);
        const EMAIL = "abhinarose@gmail.com";

        formStatus.setAttribute("role", "status");
        formStatus.setAttribute("aria-live", "polite");

        function showStatus(message, type) {
            formStatus.textContent = message;
            formStatus.className = "show is-" + type;
        }

        // Clear the error highlight as soon as the visitor edits a field
        fields.forEach(field => {
            field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
        });

        // No backend on this site, so submitting opens the visitor's email
        // client with the message pre-filled — free, no signup, no limits.
        contactForm.addEventListener("submit", event => {
            event.preventDefault();

            const data = Object.fromEntries(new FormData(contactForm).entries());
            const missing = ["name", "email", "message"].filter(key => !String(data[key] || "").trim());

            fields.forEach(field => {
                if (missing.includes(field.name)) field.setAttribute("aria-invalid", "true");
                else field.removeAttribute("aria-invalid");
            });

            if (missing.length) {
                showStatus("Please fill in all required fields.", "error");
                contactForm.elements[missing[0]].focus();
                return;
            }

            const subject = data.subject || "Message from your portfolio";
            const body =
                "From: " + data.name + " (" + data.email + ")\n\n" + data.message;

            const mailtoUrl =
                "mailto:" + EMAIL +
                "?subject=" + encodeURIComponent(subject) +
                "&body=" + encodeURIComponent(body);

            window.location.href = mailtoUrl;

            showStatus("Opening your email app to send this message…", "success");
        });
    }


    /* 9b. COPY EMAIL ====================================================== */

    const copyBtn = $("#copyEmail");

    if (copyBtn) {
        let copyTimer;

        copyBtn.addEventListener("click", async () => {
            const text = copyBtn.dataset.copy || "";

            try {
                await navigator.clipboard.writeText(text);
            } catch (error) {
                // Fallback for browsers / contexts without the Clipboard API
                const helper = document.createElement("textarea");
                helper.value = text;
                helper.setAttribute("readonly", "");
                helper.style.cssText = "position:fixed;opacity:0;pointer-events:none";
                document.body.appendChild(helper);
                helper.select();
                try { document.execCommand("copy"); } catch (e) { /* ignore */ }
                helper.remove();
            }

            copyBtn.classList.add("copied");
            copyBtn.setAttribute("aria-label", "Email address copied");

            clearTimeout(copyTimer);
            copyTimer = setTimeout(() => {
                copyBtn.classList.remove("copied");
                copyBtn.setAttribute("aria-label", "Copy email address");
            }, 2000);
        });
    }
})();