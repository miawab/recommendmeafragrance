"""
Builds /public/data/catalog-core.json, catalog-full.json and notes.json from the raw
Fragrantica CSV (./data-pipeline/raw/fra_cleaned.csv). Offline, deterministic, no network calls.

Run: cd data-pipeline && python build_catalog.py
"""
import json
import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent
RAW_CSV = ROOT / "raw" / "fra_cleaned.csv"
INCLUDE_FAMOUS_TXT = ROOT / "include_famous.txt"
PUBLIC_DATA = ROOT.parent / "public" / "data"

FAMOUS_TARGET = 300
TOTAL_CAP = 2500

# ---------------------------------------------------------------------------
# brand -> (priceTier, brandGroup) hand-tuned mapping. priceTier: 1 budget (<$50),
# 2 mid ($50-100), 3 designer ($100-170), 4 niche ($170-300), 5 ultra (>$300).
# brandGroup powers Scentle's "same brand family" partial-credit feedback.
# ---------------------------------------------------------------------------
BRAND_META = {
    # Arab / Middle Eastern houses -> cheap, huge review volume
    "lattafa-perfumes": (1, "arab-house"),
    "armaf": (1, "arab-house"),
    "afnan": (1, "arab-house"),
    "al-haramain-perfumes": (1, "arab-house"),
    "rasasi": (1, "arab-house"),
    "ajmal": (1, "arab-house"),
    "swiss-arabian": (1, "arab-house"),
    "arabian-oud": (1, "arab-house"),
    "my-perfumes": (1, "arab-house"),
    "maison-alhambra": (1, "arab-house"),
    "fragrance-world": (1, "arab-house"),
    "khadlaj": (1, "arab-house"),
    # Mass-market / celebrity / drugstore
    "adidas": (1, "mass-market"),
    "bench": (1, "mass-market"),
    "britney-spears": (1, "mass-market"),
    "paris-hilton": (1, "mass-market"),
    "ariana-grande": (1, "mass-market"),
    "jennifer-lopez": (1, "mass-market"),
    "avon": (1, "mass-market"),
    "bodycology": (1, "mass-market"),
    "zara": (1, "mass-market"),
    # Designer pillars
    "dior": (3, "designer"),
    "chanel": (3, "designer"),
    "yves-saint-laurent": (3, "designer"),
    "versace": (3, "designer"),
    "jean-paul-gaultier": (3, "designer"),
    "giorgio-armani": (3, "designer"),
    "prada": (3, "designer"),
    "paco-rabanne": (2, "designer"),
    "carolina-herrera": (2, "designer"),
    "montblanc": (2, "designer"),
    "valentino": (3, "designer"),
    "azzaro": (2, "designer"),
    "hugo-boss": (2, "designer"),
    "calvin-klein": (2, "designer"),
    "burberry": (2, "designer"),
    "dolce-gabbana": (3, "designer"),
    "gucci": (3, "designer"),
    "bvlgari": (3, "designer"),
    "lancome": (2, "designer"),
    "ralph-lauren": (2, "designer"),
    "guerlain": (3, "designer"),
    "givenchy": (2, "designer"),
    "narciso-rodriguez": (2, "designer"),
    "issey-miyake": (2, "designer"),
    "thierry-mugler": (2, "designer"),
    "viktor-rolf": (3, "designer"),
    "moschino": (2, "designer"),
    "tommy-hilfiger": (1, "designer"),
    # Niche
    "creed": (4, "niche"),
    "xerjoff": (5, "niche"),
    "nishane": (4, "niche"),
    "initio-parfums-prives": (5, "niche"),
    "maison-francis-kurkdjian": (5, "niche"),
    "amouage": (5, "niche"),
    "tom-ford": (4, "niche"),
    "roja-parfums": (5, "niche"),
    "parfums-de-marly": (4, "niche"),
    "byredo": (4, "niche"),
    "le-labo": (4, "niche"),
    "mancera": (3, "niche"),
    "montale": (3, "niche"),
    "diptyque": (4, "niche"),
    "frederic-malle": (5, "niche"),
    "penhaligon-s": (4, "niche"),
    "acqua-di-parma": (3, "niche"),
    "juliette-has-a-gun": (3, "niche"),
    "kilian": (5, "niche"),
    "clive-christian": (5, "niche"),
    "orto-parisi": (5, "niche"),
    "nasomatto": (5, "niche"),
}
DEFAULT_PRICE_TIER = 2
DEFAULT_BRAND_GROUP = "designer"

# ---------------------------------------------------------------------------
# note normalization
# ---------------------------------------------------------------------------
NOTE_SYNONYMS = {
    "vanille": "vanilla",
    "bergamote": "bergamot",
    "citruses": "citrus",
    "citrus notes": "citrus",
    "aldehydes": "aldehyde",
    "woodsy notes": "woody",
    "woody notes": "woody",
    "fruity notes": "fruity",
    "green notes": "green",
    "fresh notes": "fresh",
    "powdery notes": "powdery",
    "musky": "musk",
    "musks": "musk",
    "woodsy": "woody",
    "ambergris": "amber",
    "tonka-bean": "tonka-bean",
    "tonka beans": "tonka-bean",
    "oakmoss": "oakmoss",
    "patchoulis": "patchouli",
    "roses": "rose",
    "jasmines": "jasmine",
    "spices": "spice",
}

# suffixes safe to strip for basic singularization without mangling short words
_PLURAL_EXCEPTIONS = {
    "musk", "iris", "citrus", "moss", "grass", "amber", "rose", "spice", "cocoa",
}


def strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def normalize_note(raw: str) -> str:
    s = strip_accents(raw.strip().lower())
    s = re.sub(r"\s+notes?$", "", s)
    s = s.strip()
    s = NOTE_SYNONYMS.get(s, s)
    if s.endswith("es") and len(s) > 4 and s[:-2] not in _PLURAL_EXCEPTIONS:
        pass  # "es" plurals are rare/ambiguous here, leave as-is unless mapped above
    elif (
        s.endswith("s")
        and not s.endswith("ss")
        and not s.endswith("us")  # Latin singulars: hibiscus, lotus, narcissus, cactus, etc.
        and s not in _PLURAL_EXCEPTIONS
        and len(s) > 3
    ):
        singular = s[:-1]
        if singular not in _PLURAL_EXCEPTIONS:
            s = singular if singular not in ("citru", "amb") else s
    s = re.sub(r"[^a-z0-9\- ]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-{2,}", "-", s)
    return s


def parse_notes_field(raw) -> list[str]:
    if pd.isna(raw):
        return []
    out = []
    for part in str(raw).split(","):
        n = normalize_note(part)
        if n and n not in out:
            out.append(n)
    return out


def normalize_accord(raw: str) -> str:
    s = strip_accents(str(raw).strip().lower())
    s = re.sub(r"[^a-z0-9\- ]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s


# ---------------------------------------------------------------------------
# slugs / display names
# ---------------------------------------------------------------------------
BRAND_DISPLAY_OVERRIDES = {
    "lattafa-perfumes": "Lattafa",
    "al-haramain-perfumes": "Al Haramain",
    "initio-parfums-prives": "Initio",
    "maison-francis-kurkdjian": "Maison Francis Kurkdjian",
    "yves-saint-laurent": "Yves Saint Laurent",
}


def deslug_title(slug: str) -> str:
    if slug in BRAND_DISPLAY_OVERRIDES:
        return BRAND_DISPLAY_OVERRIDES[slug]
    words = slug.replace("-", " ").split()
    small = {"of", "de", "la", "le", "and", "for", "in", "a", "n"}
    out = []
    for i, w in enumerate(words):
        if w.isdigit():
            out.append(w)
        elif i > 0 and w in small:
            out.append(w)
        else:
            out.append(w.capitalize())
    return " ".join(out)


def make_id(brand_slug: str, name_slug: str, seen: Counter) -> str:
    base = f"{brand_slug}-{name_slug}"
    base = re.sub(r"-{2,}", "-", base).strip("-")
    if seen[base] == 0:
        seen[base] += 1
        return base
    seen[base] += 1
    return f"{base}-{seen[base]}"


# ---------------------------------------------------------------------------
# enrichment heuristics
# ---------------------------------------------------------------------------
def derive_tags(accords: list[str]) -> tuple[list[str], list[str], list[str]]:
    a = set(accords)
    seasons, occasions, vibe = set(), set(), set()

    if a & {"fresh", "citrus", "aquatic", "green", "ozonic", "aromatic"}:
        seasons.add("summer")
        seasons.add("spring")
        occasions.add("office")
        occasions.add("gym")
        vibe.add("clean")
    if a & {"sweet", "warm-spicy", "amber", "vanilla", "oriental", "gourmand"}:
        seasons.add("fall")
        seasons.add("winter")
        occasions.add("date")
        occasions.add("night-out")
        vibe.add("cozy")
    if a & {"woody", "leather", "tobacco", "oud", "smoky"}:
        occasions.add("night-out")
        vibe.add("attention-grabber")
        seasons.add("fall")
        seasons.add("winter")
    if a & {"powdery", "musky", "musk", "iris"}:
        occasions.add("office")
        vibe.add("cozy")
    if a & {"fruity", "floral", "white-floral", "yellow-floral"}:
        seasons.add("spring")
        occasions.add("date")
        vibe.add("versatile")

    if not seasons:
        seasons.add("all-season")
    if not occasions:
        occasions.add("everyday")
    if not vibe:
        vibe.add("versatile")
    return sorted(seasons), sorted(occasions), sorted(vibe)


CONCENTRATION_PATTERNS = [
    (re.compile(r"extrait", re.I), "Extrait de Parfum"),
    (re.compile(r"eau-de-parfum|\bedp\b", re.I), "EDP"),
    (re.compile(r"eau-de-toilette|\bedt\b", re.I), "EDT"),
    (re.compile(r"eau-de-cologne|\bcologne\b", re.I), "EDC"),
    (re.compile(r"\bparfum\b", re.I), "Parfum"),
]


def derive_concentration(name_slug: str) -> str:
    for pattern, label in CONCENTRATION_PATTERNS:
        if pattern.search(name_slug):
            return label
    return "EDP"


GENDER_MAP = {"women": "women", "men": "men", "unisex": "unisex"}

FUN_FACT_TEMPLATES = [
    "Opens with {top}, then settles into a {accord} base built around {base}.",
    "A {accord} scent that leans on {base} once the {top} opening fades.",
    "Known for its {accord} character, carried by {base} in the drydown.",
    "Starts bright with {top} and finishes warm with {base}.",
]


def make_fun_fact(name: str, top: list[str], base: list[str], accords: list[str], seed: int) -> str:
    accord = accords[0].replace("-", " ") if accords else "signature"
    top_txt = ", ".join(w.replace("-", " ") for w in top[:2]) or "citrus"
    base_txt = ", ".join(w.replace("-", " ") for w in base[:2]) or "musk"
    template = FUN_FACT_TEMPLATES[seed % len(FUN_FACT_TEMPLATES)]
    return template.format(top=top_txt, base=base_txt, accord=accord)


# ---------------------------------------------------------------------------
# include_famous.txt fuzzy matching
# ---------------------------------------------------------------------------
def norm_key(s: str) -> str:
    s = strip_accents(s.strip().lower())
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_include_list() -> list[tuple[str, str]]:
    if not INCLUDE_FAMOUS_TXT.exists():
        return []
    pairs = []
    for line in INCLUDE_FAMOUS_TXT.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "|" not in line:
            continue
        brand, name = line.split("|", 1)
        pairs.append((brand.strip(), name.strip()))
    return pairs


def match_include_list(df: pd.DataFrame, pairs: list[tuple[str, str]]) -> set[int]:
    brand_norm = df["Brand"].apply(lambda s: norm_key(s.replace("-", " ")))
    name_norm = df["Perfume"].apply(lambda s: norm_key(s.replace("-", " ")))
    matched_idx = set()
    for brand, name in pairs:
        bkey, nkey = norm_key(brand), norm_key(name)
        brand_hits = df.index[
            brand_norm.str.contains(re.escape(bkey), na=False)
            | brand_norm.apply(lambda b: b in bkey or bkey in b)
        ]
        if len(brand_hits) == 0:
            continue
        best_idx, best_ratio = None, 0.0
        for idx in brand_hits:
            ratio = SequenceMatcher(None, name_norm[idx], nkey).ratio()
            if nkey in name_norm[idx] or name_norm[idx] in nkey:
                ratio = max(ratio, 0.9)
            if ratio > best_ratio:
                best_ratio, best_idx = ratio, idx
        if best_idx is not None and best_ratio >= 0.55:
            matched_idx.add(best_idx)
    return matched_idx


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main():
    if not RAW_CSV.exists():
        raise SystemExit(f"Missing raw dataset at {RAW_CSV}")

    df = pd.read_csv(RAW_CSV, encoding="latin-1", sep=";")
    df.columns = [c.strip() for c in df.columns]

    df["Rating Value"] = pd.to_numeric(
        df["Rating Value"].astype(str).str.replace(",", ".", regex=False), errors="coerce"
    )
    df["Rating Count"] = pd.to_numeric(df["Rating Count"], errors="coerce").fillna(0)
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")

    df = df.dropna(subset=["Brand", "Perfume"])
    df = df[(df["Top"].notna()) | (df["Middle"].notna()) | (df["Base"].notna())]
    df = df.drop_duplicates(subset=["Brand", "Perfume"]).reset_index(drop=True)

    df["fameScore"] = df["Rating Count"].rank(pct=True)

    include_pairs = load_include_list()
    include_idx = match_include_list(df, include_pairs)

    top_by_score = set(df.sort_values("fameScore", ascending=False).head(FAMOUS_TARGET).index)
    famous_idx = top_by_score | include_idx

    remaining = df.drop(index=famous_idx).sort_values("fameScore", ascending=False)
    deep_budget = max(TOTAL_CAP - len(famous_idx), 0)
    deep_idx = set(remaining.head(deep_budget).index)

    note_counter = Counter()
    entries = []
    id_seen = Counter()

    all_idx = sorted(famous_idx | deep_idx, key=lambda i: -df.loc[i, "fameScore"])
    for rank, idx in enumerate(all_idx):
        row = df.loc[idx]
        brand_slug = str(row["Brand"]).strip().lower()
        name_slug = str(row["Perfume"]).strip().lower()
        tier = "famous" if idx in famous_idx else "deep"

        top_notes = parse_notes_field(row["Top"])
        heart_notes = parse_notes_field(row["Middle"])
        base_notes = parse_notes_field(row["Base"])
        for n in top_notes + heart_notes + base_notes:
            note_counter[n] += 1

        accords = []
        for col in ["mainaccord1", "mainaccord2", "mainaccord3", "mainaccord4", "mainaccord5"]:
            val = row.get(col)
            if pd.notna(val):
                accords.append(normalize_accord(val))

        seasons, occasions, vibe = derive_tags(accords)
        price_tier, brand_group = BRAND_META.get(brand_slug, (DEFAULT_PRICE_TIER, DEFAULT_BRAND_GROUP))
        gender = GENDER_MAP.get(str(row["Gender"]).strip().lower(), "unisex")
        year = int(row["Year"]) if pd.notna(row["Year"]) else None

        entry_id = make_id(brand_slug, name_slug, id_seen)
        name = deslug_title(name_slug)
        brand = deslug_title(brand_slug)

        entry = {
            "id": entry_id,
            "name": name,
            "brand": brand,
            "year": year,
            "gender": gender,
            "concentration": derive_concentration(name_slug),
            "priceTier": price_tier,
            "brandGroup": brand_group,
            "tier": tier,
            "fameScore": round(float(row["fameScore"]), 4),
            "notes": {"top": top_notes, "heart": heart_notes, "base": base_notes},
            "accords": accords,
            "seasons": seasons,
            "occasions": occasions,
            "vibe": vibe,
            "funFact": "",
        }
        if tier == "famous":
            entry["funFact"] = make_fun_fact(name, top_notes, base_notes, accords, rank)
        entries.append(entry)

    entries.sort(key=lambda e: -e["fameScore"])

    famous_entries = [e for e in entries if e["tier"] == "famous"]
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    (PUBLIC_DATA / "catalog-core.json").write_text(
        json.dumps(famous_entries, ensure_ascii=False, indent=None), encoding="utf-8"
    )
    (PUBLIC_DATA / "catalog-full.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=None), encoding="utf-8"
    )

    notes_out = [
        {"id": note_id, "label": note_id.replace("-", " ").title(), "count": count}
        for note_id, count in note_counter.most_common()
    ]
    (PUBLIC_DATA / "notes.json").write_text(
        json.dumps(notes_out, ensure_ascii=False, indent=None), encoding="utf-8"
    )

    unmatched = []
    matched_keys = {norm_key(f"{df.loc[i,'Brand']} {df.loc[i,'Perfume']}".replace("-", " ")) for i in include_idx}
    for brand, name in include_pairs:
        key = norm_key(f"{brand} {name}")
        hit = any(SequenceMatcher(None, key, mk).ratio() > 0.6 for mk in matched_keys)
        if not hit:
            unmatched.append(f"{brand} | {name}")
    (ROOT / "unmatched_include.txt").write_text("\n".join(unmatched), encoding="utf-8")

    print(f"Loaded {len(df)} rows from raw CSV")
    print(f"Famous tier: {len(famous_entries)} (target {FAMOUS_TARGET}, include-list matched {len(include_idx)})")
    print(f"Deep tier: {len(entries) - len(famous_entries)}")
    print(f"Total catalog entries: {len(entries)} (cap {TOTAL_CAP})")
    print(f"Canonical notes: {len(notes_out)}")
    print(f"Unmatched include-list lines: {len(unmatched)} (see unmatched_include.txt)")
    print(f"Wrote catalog-core.json, catalog-full.json, notes.json to {PUBLIC_DATA}")


if __name__ == "__main__":
    main()
