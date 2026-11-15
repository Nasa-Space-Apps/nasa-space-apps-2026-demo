"""Recorte de páginas largas por palabras clave (herramientas.recortar)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import herramientas as H  # noqa: E402


def pagina(n_bloques=40):
    bloques = [f"Bloque {i}. " + ("relleno neutro sin datos. " * 40) for i in range(n_bloques)]
    bloques[25] += " El módulo aterrizó con el radar confundido por rocas reflectantes."
    return "\n\n".join(bloques)


class Recorte(unittest.TestCase):
    def test_sin_palabras_no_cambia(self):
        t = pagina()
        self.assertEqual(H.recortar(t, ""), t[:H.MAX_CHARS])
        self.assertEqual(H.recortar(t, None), t[:H.MAX_CHARS])

    def test_pagina_corta_no_se_recorta(self):
        t = "texto corto " * 20
        self.assertEqual(H.recortar(t, "radar"), t)

    def test_larga_conserva_cabeza_y_ventana_de_la_palabra(self):
        t = pagina()
        r = H.recortar(t, "radar, rocas reflectantes")
        self.assertTrue(r.startswith(t[:200]))
        self.assertIn("radar confundido por rocas reflectantes", r)
        self.assertLessEqual(len(r), H.PRESUPUESTO_RECORTE + 200)
        self.assertLess(len(r), len(t))

    def test_sin_coincidencias_devuelve_lo_de_siempre(self):
        t = pagina()
        self.assertEqual(H.recortar(t, "zzzinexistente"), t[:H.MAX_CHARS])

    def test_el_texto_recortado_es_literal_del_original(self):
        t = pagina()
        r = H.recortar(t, "radar")
        for trozo in r.split(H.CORTE):
            self.assertIn(trozo.strip(), t)


if __name__ == "__main__":
    unittest.main()
