/**
 * End-to-end checks against a PRODUCTION build (next start), not the dev
 * server: dev has HMR, no minification and different caching, so a pass there
 * proves less than it looks.
 *
 *   node e2e.mjs http://localhost:3400
 *
 * Browser-driven assertions live in e2e-browser.sh; this file covers
 * everything checkable over HTTP.
 */
const BASE = process.argv[2] ?? "http://localhost:3400";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? `  ${detail}` : ""}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`);
  }
}

function group(title) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

async function get(path, options = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", ...options });
  const body = res.headers.get("content-type")?.includes("image/") ? "" : await res.text();
  return { status: res.status, headers: res.headers, body };
}

const run = async () => {
  console.log(`\nE2E against ${BASE}\n${"=".repeat(40)}`);

  /* ---------- routes ---------- */
  group("Routes respond");
  for (const [path, type] of [
    ["/", "text/html"],
    ["/resume", "text/html"],
    ["/robots.txt", "text/plain"],
    ["/sitemap.xml", "application/xml"],
    ["/icon/64", "image/png"],
    ["/icon/192", "image/png"],
    ["/icon/512", "image/png"],
    ["/apple-icon", "image/png"],
    ["/screenshots/desktop.png", "image/png"],
    ["/screenshots/mobile.png", "image/png"],
    ["/sarvjeet-thakur-resume.pdf", "application/pdf"],
    ["/portrait.jpg", "image/jpeg"],
  ]) {
    const r = await get(path);
    check(
      `${path}`,
      r.status === 200 && (r.headers.get("content-type") ?? "").includes(type),
      `${r.status} ${r.headers.get("content-type")?.split(";")[0]}`,
    );
  }
  const missing = await get("/this-route-does-not-exist");
  check("unknown route 404s", missing.status === 404, String(missing.status));

  /* ---------- content renders server-side (no-JS / crawler path) ---------- */
  group("Server HTML carries the content");
  const home = await get("/");
  const h = home.body;
  check("one <h1>", (h.match(/<h1/g) ?? []).length === 1, `${(h.match(/<h1/g) ?? []).length}`);
  check("name in h1", /SARVJEET THAKUR|Sarvjeet Thakur/.test(h));
  for (const section of ["work", "stack", "about", "resume", "contact"]) {
    check(`section #${section}`, h.includes(`id="${section}"`));
  }
  check(
    "all 8 projects",
    ["Fyntiq", "Addlly AI", "APMS", "M&amp;ES", "WRB", "Solstice", "GiftXD", "SnT Global"].every(
      (t) => h.includes(t),
    ),
  );
  check("skip link", h.includes("Skip to content"));
  check("main landmark", h.includes('id="main"'));
  check(
    "no visibility:hidden shipped",
    !h.includes("visibility: hidden") && !h.includes("visibility:hidden"),
  );
  check("no physics mode attr shipped", !h.includes('data-physics-mode="on"'));
  check("stat renders a derived number", /\d+ yrs/.test(h), (h.match(/\d+ yrs/) ?? [""])[0]);

  /* ---------- content that must NOT ship ---------- */
  group("Nothing leaks");
  const pdf = await fetch(BASE + "/sarvjeet-thakur-resume.pdf").then((r) => r.arrayBuffer());
  const pdfBytes = Buffer.from(pdf);
  const resume = await get("/resume");
  for (const needle of [
    "mepa.gov.ge",
    "admintestapms",
    "pme.mepa",
    "staging.giftxd",
    "csgroupchd",
    "Sector 101",
  ]) {
    check(
      `"${needle}" absent from / and /resume`,
      !h.includes(needle) && !resume.body.includes(needle),
    );
    check(`"${needle}" absent from the PDF`, !pdfBytes.includes(Buffer.from(needle)));
  }
  check("no placeholder content", !/Your Name|yourname\.dev|example\.com/.test(h + resume.body));

  /* ---------- SEO ---------- */
  group("SEO");
  const canonical = (s) => (s.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
  const og = (s, p) => (s.match(new RegExp(`property="og:${p}" content="([^"]*)"`)) ?? [])[1];
  check("home canonical", canonical(h)?.endsWith("/") || canonical(h) === BASE, canonical(h));
  check(
    "resume canonical is /resume",
    canonical(resume.body)?.endsWith("/resume"),
    canonical(resume.body),
  );
  check(
    "resume og:url is /resume",
    og(resume.body, "url")?.endsWith("/resume"),
    og(resume.body, "url"),
  );
  check("resume title differs from home", og(h, "title") !== og(resume.body, "title"));
  check("og:image absolute", /^https?:\/\//.test(og(h, "image") ?? ""), og(h, "image"));
  const ogImage = await fetch(`${BASE}${new URL(og(h, "image") ?? BASE).pathname}`);
  check(
    "og:image serves a PNG",
    ogImage.status === 200 && (ogImage.headers.get("content-type") ?? "").includes("image/png"),
    `${ogImage.status} ${ogImage.headers.get("content-type")}`,
  );
  check("og:image has alt text", Boolean(og(h, "image:alt")), og(h, "image:alt"));
  check("resume has og:image", Boolean(og(resume.body, "image")), og(resume.body, "image"));
  const robots = await get("/robots.txt");
  check("robots has sitemap", robots.body.includes("Sitemap:"));
  check("robots has no Host directive", !robots.body.includes("Host:"));
  const sitemap = await get("/sitemap.xml");
  check(
    "sitemap lists both URLs",
    (sitemap.body.match(/<loc>/g) ?? []).length === 2,
    `${(sitemap.body.match(/<loc>/g) ?? []).length} urls`,
  );

  // A trailing slash on NEXT_PUBLIC_SITE_URL once produced `app//resume`.
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check(
    "no doubled slash in sitemap",
    locs.every((u) => !/[^:]\/\//.test(u)),
    locs.join(" "),
  );
  const pdfHead = await fetch(BASE + "/sarvjeet-thakur-resume.pdf", { method: "HEAD" });
  check(
    "PDF is noindex",
    pdfHead.headers.get("x-robots-tag") === "noindex",
    pdfHead.headers.get("x-robots-tag") ?? "absent",
  );

  /* ---------- structured data ---------- */
  group("JSON-LD");
  for (const [path, body] of [
    ["/", h],
    ["/resume", resume.body],
  ]) {
    const raw = (body.match(/application\/ld\+json"[^>]*>(.*?)<\/script>/s) ?? [])[1];
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      /* reported by the check below */
    }
    check(`${path} JSON-LD parses`, data !== null);
    if (!data) continue;
    const nodes = data["@graph"] ?? [];
    const person = nodes.find((n) => n["@type"] === "Person");
    check(`${path} has Person + 8 works`, person && nodes.length === 9, `${nodes.length} nodes`);
    check(
      `${path} mainEntityOfPage matches`,
      person?.mainEntityOfPage?.["@id"]?.endsWith(path === "/" ? "" : path),
    );
    check(`${path} worksFor present`, Boolean(person?.worksFor?.name), person?.worksFor?.name);
    check(`${path} no subjectOf`, !("subjectOf" in (person ?? {})));
    check(
      `${path} unlinked works omit url`,
      nodes.filter((n) => n["@type"] === "CreativeWork" && n.url).length === 4,
    );
    check(`${path} escaped for inline script`, !raw.includes("</script"));
    const ids = nodes.map((n) => n["@id"]).filter(Boolean);
    check(
      `${path} no doubled slash in @id`,
      ids.every((u) => !/[^:]\/\//.test(u)),
      ids[0],
    );
  }

  /* ---------- caching / assets ---------- */
  group("Assets");
  const img = await fetch(`${BASE}/_next/image?url=%2Fportrait.jpg&w=640&q=100`);
  check(
    "image optimizer honours q=100",
    img.status === 200,
    `${img.status} ${img.headers.get("content-type")}`,
  );
  const remote = await fetch(`${BASE}/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75`);
  check("optimizer refuses remote URLs", remote.status >= 400, String(remote.status));
  const dotfile = await get("/.env");
  check("/.env not served", dotfile.status === 404, String(dotfile.status));

  console.log(`\n${"=".repeat(40)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (fail) console.log(`\nFailures:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(fail ? 1 : 0);
};

run().catch((e) => {
  console.error("harness error:", e.message);
  process.exit(2);
});
