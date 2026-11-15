"""Pruebas gratis del lanzador de lotes (sin red ni Claude)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import procesar_lote as pl  # noqa: E402


class LoteTest(unittest.TestCase):
    def test_pendientes_salta_los_que_tienen_dossier(self):
        with tempfile.TemporaryDirectory() as tmp:
            s = Path(tmp)
            (s / "a").mkdir(); (s / "a" / "dossier.json").write_text("{}")
            (s / "b").mkdir()  # carpeta sin dossier: sigue pendiente
            self.assertEqual(pl.pendientes(["a", "b", "c"], s), ["b", "c"])

    def test_costo_evento_lee_metricas(self):
        with tempfile.TemporaryDirectory() as tmp:
            s = Path(tmp); (s / "a").mkdir()
            (s / "a" / "metricas.json").write_text(json.dumps({"costos": {"total_usd": 0.42}}))
            self.assertAlmostEqual(pl.costo_evento("a", s), 0.42)
            self.assertEqual(pl.costo_evento("no_existe", s), 0.0)

    def test_ids_del_archivo_de_la_historia(self):
        ids = pl.ids_del_archivo(pl.ARCHIVO)
        self.assertEqual(len(ids), 20)
        self.assertEqual(ids[0], "opp001")




class ParaleloTest(unittest.TestCase):
    """Lógica de paralelismo con eventos simulados (sin procesos reales)."""

    def test_no_supera_el_maximo_de_simultaneos(self):
        import threading
        import time
        activos, maximo, lock = [0], [0], threading.Lock()

        def correr(ev):
            with lock:
                activos[0] += 1
                maximo[0] = max(maximo[0], activos[0])
            time.sleep(0.05)
            with lock:
                activos[0] -= 1
            return 0, ""

        r = pl.procesar([f"e{i}" for i in range(9)], correr, lambda e: 0.1, paralelo=3, tope=99, log=lambda m: None)
        self.assertEqual(len(r["ok"]), 9)
        self.assertLessEqual(maximo[0], 3)
        self.assertGreaterEqual(maximo[0], 2)  # de verdad corrió en paralelo

    def test_serie_es_un_evento_a_la_vez(self):
        import threading
        import time
        activos, maximo, lock = [0], [0], threading.Lock()

        def correr(ev):
            with lock:
                activos[0] += 1
                maximo[0] = max(maximo[0], activos[0])
            time.sleep(0.02)
            with lock:
                activos[0] -= 1
            return 0, ""

        pl.procesar(["a", "b", "c"], correr, lambda e: 0.1, paralelo=1, tope=99, log=lambda m: None)
        self.assertEqual(maximo[0], 1)

    def test_el_tope_detiene_los_eventos_siguientes(self):
        r = pl.procesar([f"e{i}" for i in range(6)], lambda ev: (0, ""), lambda e: 1.0, paralelo=1, tope=3.0, log=lambda m: None)
        self.assertEqual(len(r["ok"]), 3)
        self.assertEqual(len(r["omitidos"]), 3)
        self.assertIn("tope", r["motivo_parada"])

    def test_fallos_seguidos_detienen_el_lote(self):
        r = pl.procesar([f"e{i}" for i in range(6)], lambda ev: (1, "error"), lambda e: 0.0, paralelo=1, max_fallos=3, log=lambda m: None)
        self.assertEqual(len(r["fallidos"]), 3)
        self.assertEqual(len(r["omitidos"]), 3)
        self.assertIn("fallos", r["motivo_parada"])

    def test_un_exito_reinicia_la_cuenta_de_fallos(self):
        codigos = iter([1, 1, 0, 1, 1, 0])
        r = pl.procesar([f"e{i}" for i in range(6)], lambda ev: (next(codigos), ""), lambda e: 0.0, paralelo=1, max_fallos=3, log=lambda m: None)
        self.assertEqual(len(r["omitidos"]), 0)
        self.assertEqual(len(r["ok"]), 2)

    def test_ya_procesado_no_cuenta_como_fallo(self):
        r = pl.procesar(["a", "b"], lambda ev: (2, ""), lambda e: 0.0, paralelo=1, log=lambda m: None)
        self.assertEqual(r["saltados"], ["a", "b"])
        self.assertEqual(r["fallidos"], [])


if __name__ == "__main__":
    unittest.main()
