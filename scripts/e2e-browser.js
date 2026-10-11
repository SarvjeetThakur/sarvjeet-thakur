/*
 * Browser-side assertions against the production server. Everything here
 * needs a real layout, real focus or a real hit test, so none of it is
 * checkable over HTTP.
 */
(() => {
  const out = [];
  const t = (name, cond, detail = "") =>
    out.push(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);

  // Smooth scrolling is async, so focus assertions would measure the position
  // before the scroll lands. Instant for the duration of the run.
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  const headerEl = document.querySelector("header");
  const barEl = [...document.querySelectorAll("div")].find(
    (d) => getComputedStyle(d).position === "fixed" && d.className.includes("bottom-0"),
  );
  const header = headerEl.getBoundingClientRect();
  const bar = barEl.getBoundingClientRect();
  const isChrome = (el) => headerEl.contains(el) || barEl.contains(el);

  const interactive = [...document.querySelectorAll("a[href], button")].filter(
    (el) => el.offsetParent !== null && !el.className.includes("sr-only"),
  );

  t(
    "no horizontal overflow",
    document.documentElement.scrollWidth <= window.innerWidth + 1,
    `${document.documentElement.scrollWidth} vs ${window.innerWidth}`,
  );

  /*
   * Effective hit area, not the element box: a project card's link is 39px of
   * text but carries an ::after covering the whole card, so measuring the box
   * alone reports a false failure.
   */
  const small = [];
  for (const el of interactive) {
    if (isChrome(el)) continue;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    let h = r.height;
    /*
     * A card link is 26px of title text but carries an ::after covering the
     * card, so the box understates it. The prose is deliberately lifted above
     * that overlay to stay selectable, so probe the image band instead and
     * take the contiguous clickable run from there.
     */
    const card = el.closest("article");
    if (card) {
      const c = card.getBoundingClientRect();
      let lo = null;
      let hi = null;
      for (let f = 0.04; f < 0.99; f += 0.04) {
        const y = Math.round(c.top + c.height * f);
        const hit = document.elementFromPoint(Math.round(c.left + c.width / 2), y);
        if (hit && hit.closest("a") === el) {
          if (lo === null) lo = y;
          hi = y;
        } else if (lo !== null) break;
      }
      if (lo !== null) h = Math.max(h, hi - lo);
    }
    if (h < 44) small.push(`"${el.textContent.trim().slice(0, 16)}" ${Math.round(h)}px`);
  }
  t(
    "tap targets >= 44px",
    small.length === 0,
    small.length ? small.slice(0, 3).join(", ") : `${interactive.length} checked`,
  );

  const imgs = [...document.querySelectorAll("img")];
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0);
  t(
    "no broken images",
    broken.length === 0,
    broken.length ? broken.map((i) => i.currentSrc).join(", ") : `${imgs.length} loaded`,
  );

  const upscaled = imgs
    .filter((i) => i.naturalWidth > 0 && i.getBoundingClientRect().width > i.naturalWidth * 1.15)
    .map((i) => `${Math.round(i.getBoundingClientRect().width)}px from ${i.naturalWidth}px`);
  t("no image upscaled >1.15x", upscaled.length === 0, upscaled.slice(0, 3).join(", "));

  const levels = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
  let skips = 0;
  for (let i = 1; i < levels.length; i += 1) if (levels[i] - levels[i - 1] > 1) skips += 1;
  t("no skipped heading levels", skips === 0, `${levels.length} headings`);
  t("exactly one h1", document.querySelectorAll("h1").length === 1);

  const lists = [...document.querySelectorAll("ul,ol")];
  const bare = lists.filter(
    (l) => !l.getAttribute("role") && getComputedStyle(l).listStyleType === "none",
  );
  t("lists keep list semantics", bare.length === 0, `${lists.length} lists, ${bare.length} bare`);

  /* Focus must never land fully behind the fixed chrome. The chrome's own
     controls are excluded: they are the thing doing the obscuring. */
  let obscured = 0;
  let checked = 0;
  const firstBad = [];
  for (const el of interactive) {
    if (isChrome(el)) continue;
    el.focus();
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    checked += 1;
    if (r.bottom <= header.bottom || r.top >= bar.top) {
      obscured += 1;
      if (firstBad.length < 2) firstBad.push(`"${el.textContent.trim().slice(0, 16)}"`);
    }
  }
  t(
    "focus never fully hidden",
    obscured === 0,
    `${checked} checked${firstBad.length ? `, e.g. ${firstBad.join(", ")}` : ""}`,
  );

  t("starfield aria-hidden", document.querySelector("canvas")?.closest("[aria-hidden]") !== null);

  document.documentElement.style.scrollBehavior = prevBehavior;
  window.scrollTo(0, 0);
  return out.join("\n");
})();
