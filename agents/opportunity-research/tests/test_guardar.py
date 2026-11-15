"""Prueba gratis de que el resultado se guarda aunque la carpeta del evento no exista (regresión: se perdió un evento por esto)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import agente  # noqa: E402
from esquema import Dato, Dossier  # noqa: E402


class GuardarTest(unittest.TestCase):
    def test_crea_la_carpeta_y_escribe_los_tres_archivos(self):
        d = Dossier(evento_id="e1", titulo="t", contexto_ampliado="c", datos_reales=[Dato(afirmacion="a", fuente_url="https://x.org", cita="q")],
                    fuentes_nuevas=[], contradicciones=[], huecos=[], ideas_visuales=["i"])
        met = {"por_modelo": {"m": {"costUSD": 0.1}}, "turnos": 3}
        with tempfile.TemporaryDirectory() as tmp:
            carpeta = Path(tmp) / "salida" / "e1"   # no existe todavía
            agente.guardar(d, "modo de prueba", met, carpeta)
            self.assertTrue((carpeta / "dossier.json").exists())
            self.assertTrue((carpeta / "dossier.md").exists())
            m = json.loads((carpeta / "metricas.json").read_text(encoding="utf-8"))
            self.assertEqual(m["modo"], "modo de prueba")
            self.assertAlmostEqual(m["costos"]["total_usd"], 0.1)
            self.assertNotIn("Imágenes", (carpeta / "dossier.md").read_text(encoding="utf-8"))

    def test_archivar_y_guardar_en_carpeta_nueva(self):
        with tempfile.TemporaryDirectory() as tmp:
            agente.archivar_anterior(Path(tmp) / "no_existe")   # no debe fallar


if __name__ == "__main__":
    unittest.main()
