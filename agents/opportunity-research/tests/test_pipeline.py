"""Pruebas gratis de pipeline.py: estado, prefiltro, selección, conciliación e historia, en una raíz temporal (sin red ni Claude)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import mision as M  # noqa: E402
import pipeline as P  # noqa: E402


def evento(i, fase="operaciones", n=1):
    return {"id": i, "orden": n, "fecha_inicio": "2005-01-01", "fecha_fin": None, "sol": 10, "titulo": f"Evento {i}", "fase": fase,
            "categoria": "ciencia", "respaldo": "oficial_o_cientifico", "discutido": False, "nota": None,
            "fuentes": [{"tipo": "oficial NASA/JPL", "verificacion": "página abierta completa"}]}


def dossier(i, verificados=6):
    return {"evento_id": i, "titulo": f"Evento {i}", "contexto_ampliado": "contexto",
            "datos_reales": [{"afirmacion": f"a{k}", "cita": "q", "fuente_url": "https://x.org"} for k in range(verificados)],
            "datos_no_verificados": [], "fuentes_nuevas": [{"titulo": "t", "editor": "e", "url": "https://x.org", "tipo": "oficial NASA/JPL"}],
            "contradicciones": [], "huecos": [], "ideas_visuales": ["una imagen"]}


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        t = Path(self.tmp.name)
        self.p = mock.patch.multiple(M, RAIZ=t, MISIONES=t / "misiones", TIMELINES=t / "timelines_v0")
        self.p.start()
        (t / "timelines_v0").mkdir()
        evs = [evento("tst001", "origen", 1), evento("tst002", "operaciones", 2), evento("tst003", "operaciones", 3), evento("tst004", "legado", 4)]
        (t / "timelines_v0" / "linea_de_tiempo_tst.json").write_text(json.dumps({"mision": {"nombre_completo": "Test"}, "eventos": evs}), encoding="utf-8")
        self.t = t

    def tearDown(self):
        self.p.stop()
        self.tmp.cleanup()


class EstadoTest(Base):
    def test_sin_base_pide_fase_1(self):
        e = P.estado("otra")
        self.assertFalse(e["fase1"]["existe"])
        self.assertIn("FASE 1", e["siguiente"])

    def test_con_base_y_sin_seleccion_se_detiene_en_la_compuerta_de_n(self):
        e = P.estado("tst")
        self.assertIn("COMPUERTA", e["siguiente"])
        self.assertIn(20, [o["n"] for o in e["estimaciones"]["opciones"]])

    def test_estimacion_es_lineal(self):
        self.assertEqual(P.estimacion(20)["usd"], round(20 * P.USD_POR_EVENTO, 1))

    def test_n_sugerido_entre_20_y_30(self):
        self.assertEqual((P.n_sugerido(40), P.n_sugerido(81), P.n_sugerido(400)), (20, 20, 30))


class CuotasTest(unittest.TestCase):
    def test_suma_n_y_respeta_maximos(self):
        c = P.cuotas({"origen": 6, "operaciones": 51, "legado": 2}, 20)
        self.assertEqual(sum(c.values()), 20)
        self.assertLessEqual(c["legado"], 2)
        self.assertGreaterEqual(c["origen"], 1)

    def test_n_menor_que_fases(self):
        c = P.cuotas({"origen": 1, "operaciones": 9, "legado": 2}, 2)
        self.assertEqual(sum(c.values()), 2)


class FlujoTest(Base):
    def args(self, **k):
        import argparse
        return argparse.Namespace(**k)

    def test_seleccion_rechaza_ids_inexistentes(self):
        with self.assertRaises(SystemExit):
            P.cmd_seleccion(self.args(id="tst", ids="tst001,nope", archivo=None, desde_historia=None))

    def test_seleccion_rechaza_repetidos(self):
        with self.assertRaises(SystemExit):
            P.cmd_seleccion(self.args(id="tst", ids="tst001,tst001", archivo=None, desde_historia=None))

    def test_seleccion_escribe_en_la_carpeta_de_la_mision(self):
        P.cmd_seleccion(self.args(id="tst", ids="tst002,tst001", archivo=None, desde_historia=None))
        s = json.loads((self.t / "misiones" / "tst" / "seleccion" / "seleccion.json").read_text(encoding="utf-8"))
        self.assertEqual(s["ids"], ["tst001", "tst002"])  # ordenados por orden en la línea de tiempo
        self.assertEqual(s["n"], 2)

    def test_prefiltro_no_toca_otra_mision(self):
        P.cmd_prefiltro(self.args(id="tst", n=3))
        self.assertTrue((self.t / "misiones" / "tst" / "seleccion" / "prefiltro.json").exists())
        self.assertFalse((self.t / "misiones" / "otra").exists())

    def test_conciliar_marca_fragil_y_faltantes(self):
        P.cmd_seleccion(self.args(id="tst", ids="tst001,tst002", archivo=None, desde_historia=None))
        d = self.t / "misiones" / "tst" / "dossiers" / "tst001"
        d.mkdir(parents=True)
        (d / "dossier.json").write_text(json.dumps(dossier("tst001", verificados=2)), encoding="utf-8")
        P.cmd_conciliar(self.args(id="tst"))
        inf = json.loads((self.t / "misiones" / "tst" / "informes" / "conciliacion.json").read_text(encoding="utf-8"))
        self.assertEqual(inf["sin_dossier"], ["tst002"])
        self.assertEqual(inf["fragiles"], ["tst001"])

    def test_historia_exige_dossiers_y_textos(self):
        P.cmd_seleccion(self.args(id="tst", ids="tst001", archivo=None, desde_historia=None))
        with self.assertRaises(SystemExit):
            P.cmd_historia(self.args(id="tst", crear=True, forzar=False, textos=None, validar=False, html=False))
        d = self.t / "misiones" / "tst" / "dossiers" / "tst001"
        d.mkdir(parents=True)
        (d / "dossier.json").write_text(json.dumps(dossier("tst001")), encoding="utf-8")
        P.cmd_historia(self.args(id="tst", crear=True, forzar=False, textos=None, validar=False, html=False))
        h = json.loads((self.t / "misiones" / "tst" / "historia" / "historia_tst.json").read_text(encoding="utf-8"))
        self.assertEqual(len(P.problemas_historia(h)), 2)  # faltan gancho y emocion
        with self.assertRaises(SystemExit):  # no se pisa sin --forzar
            P.cmd_historia(self.args(id="tst", crear=True, forzar=False, textos=None, validar=False, html=False))

    def test_nueva_no_sobrescribe(self):
        a = self.args(id="nuevo", nombre="N", tipo="rover", cuerpo="Marte", agencia="NASA", prefijo="nue", publico="x", sol_cero="2004-01-01", sol_offset=0, sin_sol=False)
        P.cmd_nueva(a)
        with self.assertRaises(SystemExit):
            P.cmd_nueva(a)

    def test_nueva_en_marte_exige_sol(self):
        a = self.args(id="nuevo2", nombre="N", tipo="rover", cuerpo="Marte", agencia="NASA", prefijo="nu2", publico="x", sol_cero=None, sol_offset=0, sin_sol=False)
        with self.assertRaises(SystemExit):
            P.cmd_nueva(a)


if __name__ == "__main__":
    unittest.main()
