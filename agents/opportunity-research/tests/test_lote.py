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


if __name__ == "__main__":
    unittest.main()
