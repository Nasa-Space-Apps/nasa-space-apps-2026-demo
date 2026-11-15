"""Pruebas gratis del juego v2: estructura, trazabilidad a los dossiers verificados y reglas de contenido.
Uso (desde la raíz del repo): python -m unittest discover -s story/tests
"""
import json
import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
JUEGO = json.loads((RAIZ / "story" / "data" / "juego2_opportunity.json").read_text(encoding="utf-8"))
NODOS = JUEGO["nodos"]
N = {n["id"]: n for n in NODOS}
DOSSIERS = RAIZ / "agents" / "opportunity-research" / "salida"

# Afirmaciones que los dossiers NO pudieron confirmar o que contradijeron: no deben aparecer en el juego.
PROHIBIDO = ["botas geológicas", "Goldin", "16 de julio", "giros en K", "purgatoides", "válvula", "debutaba", "Matijevic", "Turkey Haven",
             "evidencia más poderosa", "rover gemelo", "rueda delantera derecha ya", "deshabilitada", "El Capitán"]


def textos(n):
    t = [n["titulo"], n["narrativa"]["texto"]]
    t += n.get("contexto", {}).get("lo_que_sabes", []) + [n.get("contexto", {}).get("en_juego", ""), n.get("resultado_real", ""), n.get("leccion", "")]
    t += [x for o in n.get("opciones", []) for x in (o["texto"], o["detalle"])]
    t += [n.get("dato_desbloqueado", {}).get("texto", "")]
    return [x for x in t if x]


class EstructuraTest(unittest.TestCase):
    def test_treinta_nodos_con_ids_unicos(self):
        self.assertEqual(len(NODOS), 30)
        self.assertEqual(len(N), 30)

    def test_composicion(self):
        r = JUEGO["resumen"]
        self.assertEqual((r["historia"], r["decisiones"], r["ficticios_nivel_1"], r["ficticios_nivel_2"]), (12, 6, 6, 6))

    def test_camino_real_son_18_nodos_y_los_ficticios_12(self):
        reales = [n for n in NODOS if not n["ficticio"]]
        self.assertEqual(len(reales), 18)
        self.assertEqual(len([n for n in NODOS if n["ficticio"]]), 12)

    def test_cada_decision_tiene_dos_opciones_y_una_correcta(self):
        for n in NODOS:
            if n["tipo"] == "decision":
                self.assertEqual(len(n["opciones"]), 2, n["id"])
                self.assertEqual(sum(o["correcta"] for o in n["opciones"]), 1, n["id"])

    def test_cada_opcion_equivocada_lleva_a_exactamente_dos_nodos_ficticios(self):
        for n in NODOS:
            if n["tipo"] != "decision":
                continue
            mala = next(o for o in n["opciones"] if not o["correcta"])
            n1 = N[mala["siguiente"]]
            self.assertEqual((n1["tipo"], n1["nivel"], n1["ficticio"]), ("escena_alternativa", 1, True), n["id"])
            n2 = N[n1["siguiente"]]
            self.assertEqual((n2["tipo"], n2["nivel"], n2["ficticio"]), ("fallo", 2, True), n["id"])
            self.assertEqual(n2["volver_a"], n["id"])
            self.assertNotIn("siguiente", n2)

    def test_la_opcion_correcta_sigue_el_camino_real(self):
        for n in NODOS:
            if n["tipo"] == "decision":
                buena = next(o for o in n["opciones"] if o["correcta"])
                self.assertFalse(N[buena["siguiente"]]["ficticio"], n["id"])

    def test_empieza_con_dos_historias_y_nunca_hay_dos_decisiones_seguidas(self):
        ruta, i = [], JUEGO["inicio"]
        while i:
            n = N[i]
            ruta.append(n)
            i = n.get("siguiente") or (next(o["siguiente"] for o in n["opciones"] if o["correcta"]) if n["tipo"] == "decision" else None)
        self.assertEqual(len(ruta), 18)
        self.assertEqual([n["tipo"] for n in ruta[:3]], ["historia", "historia", "decision"])
        for a, b in zip(ruta, ruta[1:]):
            self.assertFalse(a["tipo"] == b["tipo"] == "decision", (a["id"], b["id"]))
        self.assertTrue(ruta[-1].get("final"))

    def test_todo_es_alcanzable(self):
        vistos, pila = set(), [JUEGO["inicio"]]
        while pila:
            i = pila.pop()
            if i in vistos:
                continue
            vistos.add(i)
            n = N[i]
            pila += [n[k] for k in ("siguiente", "volver_a") if k in n] + [o["siguiente"] for o in n.get("opciones", [])]
        self.assertEqual(vistos, set(N))


class ParaOtrosAgentesTest(unittest.TestCase):
    """El JSON lo consumirá otro agente: grafo explícito, roles claros y hechos ya resueltos."""

    def test_aristas_cubren_todas_las_conexiones(self):
        ar = JUEGO["aristas"]
        self.assertEqual(len(ar), 35)
        tipos = {}
        for a in ar:
            self.assertIn(a["desde"], N)
            self.assertIn(a["hacia"], N)
            tipos[a["tipo"]] = tipos.get(a["tipo"], 0) + 1
        self.assertEqual(tipos, {"continuar": 17, "opcion_correcta": 6, "opcion_equivocada": 6, "volver_a_decidir": 6})

    def test_cada_nodo_tiene_rol_y_orden(self):
        roles = {"historia_real": 12, "decision": 6, "ficticio_consecuencia": 6, "ficticio_final_alternativo": 6}
        cuenta = {}
        for n in NODOS:
            cuenta[n["rol"]] = cuenta.get(n["rol"], 0) + 1
            if n["ficticio"]:
                self.assertIsNone(n["orden_camino_real"], n["id"])
                self.assertIn(n["rama_de"], N, n["id"])
                self.assertEqual(N[n["rama_de"]]["tipo"], "decision")
                self.assertTrue(n["opcion_origen"].startswith(n["rama_de"]), n["id"])
            else:
                self.assertIsNone(n["rama_de"], n["id"])
        self.assertEqual(cuenta, roles)
        self.assertEqual(sorted(n["orden_camino_real"] for n in NODOS if n["orden_camino_real"]), list(range(1, 19)))

    def test_respaldo_detalle_resuelve_cada_referencia(self):
        for n in NODOS:
            refs = set(n.get("respaldo", []) + n.get("respaldo_resultado", []) + n.get("en_realidad_respaldo", []))
            self.assertEqual({d["ref"] for d in n["respaldo_detalle"]}, refs, n["id"])
            for d in n["respaldo_detalle"]:
                self.assertTrue(d["afirmacion"] and d["cita"] and d["fuente_url"].startswith("http"), (n["id"], d["ref"]))

    def test_documentacion_para_el_agente(self):
        self.assertGreaterEqual(len(JUEGO["diccionario"]), 15)
        self.assertGreaterEqual(len(JUEGO["uso_para_agentes"]), 4)


class DecisionClaraTest(unittest.TestCase):
    def test_cada_decision_da_contexto_suficiente(self):
        for n in NODOS:
            if n["tipo"] == "decision":
                c = n["contexto"]
                self.assertGreaterEqual(len(c["lo_que_sabes"]), 3, n["id"])
                self.assertTrue(c["en_juego"].strip(), n["id"])
                self.assertTrue(n["pregunta"].strip(), n["id"])
                for o in n["opciones"]:
                    self.assertTrue(o["detalle"].strip(), (n["id"], o["id"]))
                self.assertTrue(n["resultado_real"].strip(), n["id"])


class TrazabilidadTest(unittest.TestCase):
    def test_cada_referencia_existe_en_un_dossier_verificado(self):
        for n in NODOS:
            for r in n.get("respaldo", []) + n.get("respaldo_resultado", []) + n.get("en_realidad_respaldo", []):
                ev, i = r.split("#")
                d = json.loads((DOSSIERS / ev / "dossier.json").read_text(encoding="utf-8"))
                self.assertLess(int(i), len(d["datos_reales"]), f"{n['id']} -> {r}")

    def test_los_nodos_reales_tienen_respaldo_y_fuentes(self):
        for n in NODOS:
            if not n["ficticio"]:
                self.assertGreaterEqual(len(n["respaldo"]), 3, n["id"])
                self.assertTrue(n["fuentes"], n["id"])
                self.assertTrue(n["dato_desbloqueado"]["texto"], n["id"])

    def test_los_nodos_ficticios_no_llevan_fuentes_ni_respaldo(self):
        for n in NODOS:
            if n["ficticio"]:
                self.assertEqual(n["respaldo"], [], n["id"])
                self.assertEqual(n["fuentes"], [], n["id"])

    def test_los_ficticios_no_inventan_citas_ni_cifras(self):
        for n in NODOS:
            if n["ficticio"]:
                t = n["narrativa"]["texto"]
                self.assertNotIn("«", t, n["id"])
                self.assertNotIn("%", t, n["id"])
                numeros = [x for x in re.findall(r"\d+(?:[.,]\d+)*", t) if not re.fullmatch(r"(19|20)\d\d", x)]
                self.assertEqual(numeros, [], f"{n['id']} tiene cifras: {numeros}")

    def test_los_finales_alternativos_explican_lo_que_paso_en_realidad(self):
        for n in NODOS:
            if n["tipo"] == "fallo":
                self.assertGreater(len(n["leccion"]), 60, n["id"])
                self.assertTrue(n["en_realidad_respaldo"], n["id"])

    def test_no_aparece_ninguna_afirmacion_no_confirmada(self):
        for n in NODOS:
            for t in textos(n):
                for p in PROHIBIDO:
                    self.assertNotIn(p.lower(), t.lower(), f"{n['id']}: «{p}»")


if __name__ == "__main__":
    unittest.main()
