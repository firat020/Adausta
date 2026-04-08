import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright
import json
import os

OUTPUT_DIR = "C:/Adausta/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

URLS = [
    "https://usta-bul.com",
    "https://usta-bul.com/hizmetler",
]

def scrape(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        print(f"\n{'='*60}")
        print(f"Yükleniyor: {url}")

        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)  # JS render bekle

        title = page.title()
        html = page.content()

        # Sayfa yapısını analiz et
        structure = page.evaluate("""() => {
            const result = {
                title: document.title,
                metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                h1: Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()),
                h2: Array.from(document.querySelectorAll('h2')).map(e => e.innerText.trim()),
                h3: Array.from(document.querySelectorAll('h3')).map(e => e.innerText.trim()),
                navLinks: Array.from(document.querySelectorAll('nav a')).map(e => ({
                    text: e.innerText.trim(),
                    href: e.href
                })),
                buttons: Array.from(document.querySelectorAll('button, .btn, [class*="button"]')).map(e => e.innerText.trim()).filter(t => t.length > 0),
                cards: Array.from(document.querySelectorAll('[class*="card"], [class*="item"], [class*="service"], [class*="hizmet"]')).map(e => e.innerText.trim().substring(0, 200)),
                allText: document.body.innerText.substring(0, 10000),
                links: Array.from(document.querySelectorAll('a')).map(e => ({
                    text: e.innerText.trim(),
                    href: e.href
                })).filter(l => l.text.length > 0),
            };
            return result;
        }""")

        slug = url.replace("https://", "").replace("/", "_").replace(".", "_")

        # HTML kaydet
        with open(f"{OUTPUT_DIR}/{slug}.html", "w", encoding="utf-8") as f:
            f.write(html)

        # JSON kaydet
        with open(f"{OUTPUT_DIR}/{slug}.json", "w", encoding="utf-8") as f:
            json.dump(structure, f, ensure_ascii=False, indent=2)

        print(f"Title: {title}")
        print(f"\n=== H1 ===")
        for h in structure["h1"]: print(f"  • {h}")
        print(f"\n=== H2 ===")
        for h in structure["h2"][:15]: print(f"  • {h}")
        print(f"\n=== H3 ===")
        for h in structure["h3"][:15]: print(f"  • {h}")
        print(f"\n=== NAV LİNKLERİ ===")
        for l in structure["navLinks"]: print(f"  • {l['text']} → {l['href']}")
        print(f"\n=== BUTONLAR ===")
        for b in structure["buttons"][:20]: print(f"  • {b}")
        print(f"\n=== SAYFA METNİ (ilk 3000 kar) ===")
        print(structure["allText"][:3000])
        print(f"\n[HTML kaydedildi: {OUTPUT_DIR}/{slug}.html]")
        print(f"[JSON kaydedildi: {OUTPUT_DIR}/{slug}.json]")

        browser.close()

for url in URLS:
    try:
        scrape(url)
    except Exception as e:
        print(f"HATA ({url}): {e}")
