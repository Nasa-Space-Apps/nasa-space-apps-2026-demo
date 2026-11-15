"""Pruebas gratis del cálculo de costos por modelo (sin red ni Claude)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import costos  # noqa: E402


def uso(usd, entrada=0, salida=0):
    return {"costUSD": usd, "inputTokens": entrada, "outputTokens": salida, "cacheReadInputTokens": 10,
            "cacheCreationInputTokens": 5, "thinkingTokens": 2}


class CostosTest(unittest.TestCase):
    def test_suma_investigacion_y_revision_por_modelo(self):
        met = {"por_modelo": {"sonnet": uso(0.40, 16, 1000), "haiku": uso(0.002, 2000, 28)},
               "revision": {"por_modelo": {"opus": uso(0.28, 3, 900), "haiku": uso(0.001, 100, 5)}}}
        r = costos.resumir_corrida(met)
        self.assertAlmostEqual(r["total_usd"], 0.683, places=6)
        self.assertAlmostEqual(r["por_paso"]["investigacion"], 0.402, places=6)
        self.assertAlmostEqual(r["por_paso"]["revision"], 0.281, places=6)
        self.assertAlmostEqual(r["por_modelo"]["haiku"]["usd"], 0.003, places=6)
        self.assertEqual(r["por_modelo"]["haiku"]["entrada"], 2100)
        self.assertEqual(r["por_modelo"]["opus"]["salida"], 900)

    def test_sin_revision_funciona(self):
        r = costos.resumir_corrida({"por_modelo": {"sonnet": uso(0.4)}})
        self.assertEqual(r["por_paso"]["revision"], 0)
        self.assertAlmostEqual(r["total_usd"], 0.4)

    def test_metricas_vacias(self):
        self.assertEqual(costos.resumir_corrida({})["total_usd"], 0)

    def test_tabla_incluye_total(self):
        r = costos.resumir_corrida({"por_modelo": {"sonnet": uso(0.4)}})
        self.assertIn("TOTAL 0.4000", costos.tabla_corrida(r))


if __name__ == "__main__":
    unittest.main()
