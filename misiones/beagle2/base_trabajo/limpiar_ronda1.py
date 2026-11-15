"""Revisión manual de la fusión de la ronda 1 de Beagle 2: une duplicados semánticos (suma sus fuentes al evento que queda)
y corrige fases. Solo mueve datos que ya existen; no agrega hechos."""
import json
import sys

ENTRADA, SALIDA = sys.argv[1], sys.argv[2]
d = json.load(open(ENTRADA, encoding="utf-8"))
E = {e["id"]: e for e in d["eventos"]}

# (evento que se elimina, evento que lo absorbe)
UNIR = [("bgl016", "bgl015"), ("bgl028", "bgl029"), ("bgl032", "bgl033"), ("bgl035", "bgl031"), ("bgl037", "bgl038")]
for borrar, queda in UNIR:
    destino = E[queda]
    vistos = {s["url"] for s in destino["fuentes"]}
    for s in E[borrar]["fuentes"]:
        if s["url"] not in vistos:
            destino["fuentes"].append(s)
            vistos.add(s["url"])
    if E[borrar]["discutido"] and not destino["discutido"]:
        destino["discutido"] = True
        destino["nota"] = E[borrar]["nota"]
    del E[borrar]

# Fases: el 25 dic es el día del aterrizaje; las imágenes y el hallazgo con HiRISE son el legado (guía 7.2)
E["bgl017"]["fase"] = "aterrizaje"
for i in ("bgl038", "bgl040", "bgl041", "bgl042", "bgl044", "bgl045"):
    E[i]["fase"] = "legado"

d["eventos"] = [E[e["id"]] for e in d["eventos"] if e["id"] in E]
json.dump(d, open(SALIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("eventos", len(d["eventos"]))
