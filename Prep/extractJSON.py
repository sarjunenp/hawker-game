import json, re, csv

INPUT = "Hawker Centres (GEOJSON).geojson"
OUT_JSON = "centres_min.json"
OUT_CSV = "centres_seed.csv"

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-{2,}", "-", s)
    return s

with open(INPUT, "r", encoding="utf-8") as f:
    data = json.load(f)

seen = set()
centres = []

for feat in data.get("features", []):
    props = feat.get("properties", {}) or {}
    geom = feat.get("geometry", {}) or {}
    coords = geom.get("coordinates") or []

    if geom.get("type") != "Point" or len(coords) != 2:
        continue

    lon, lat = coords[0], coords[1]

    # sanity bounds for SG
    if not (1.15 <= float(lat) <= 1.48 and 103.60 <= float(lon) <= 104.10):
        continue

    oid = props.get("OBJECTID")
    name = props.get("NAME")
    status = props.get("STATUS") or ""

    if not oid or not name:
        continue

    # optional: keep only "Existing..." for MVP map
    if not status.lower().startswith("existing"):
        continue

    if oid in seen:
        continue
    seen.add(oid)

    centres.append({
        "id": int(oid),
        "name": name.strip(),
        "lat": float(lat),
        "lon": float(lon),
        "postal_code": props.get("ADDRESSPOSTALCODE"),
        "street": props.get("ADDRESSSTREETNAME"),
        "status": status,
        "slug": slugify(name),
    })

# sort for stable output
centres.sort(key=lambda x: x["name"])

# write JSON (what the frontend can fetch for markers)
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(centres, f, ensure_ascii=False, indent=2)

# write CSV (easy DB seed)
with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","name","lat","lon","postal_code","street","status","slug"])
    w.writeheader()
    w.writerows(centres)

print(f"Exported {len(centres)} centres → {OUT_JSON} & {OUT_CSV}")
