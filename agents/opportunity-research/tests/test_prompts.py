"""Pruebas gratis (sin red ni Claude): python -m unittest discover -s tests"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import prompts  # noqa: E402

REGLAS_CLAVE = ("`cita`", "`fuente_url`", "`contradicciones`", "`huecos`", "`ideas_visuales`", "datos_reales")
HERRAMIENTAS = ("leer_pagina", "buscar_imagenes_nasa", "archivos_nasa", "buscar_papers_ntrs")


class PromptsTest(unittest.TestCase):
    def test_sistema_carga_con_version(self):
        texto, version = prompts.sistema()
        self.assertTrue(texto.startswith("Eres un investigador"))
        self.assertNotEqual(version, "sin-version")
        self.assertNotIn("---\nversion", texto)

    def test_sistema_menciona_campos_del_esquema_y_herramientas(self):
        texto, _ = prompts.sistema()
        for k in REGLAS_CLAVE + HERRAMIENTAS:
            self.assertIn(k, texto, f"el prompt ya no menciona {k}")

    def test_campos_del_prompt_existen_en_el_esquema(self):
        from esquema import Dossier
        campos = set(Dossier.model_fields)
        for k in ("datos_reales", "contradicciones", "huecos", "ideas_visuales", "contexto_ampliado"):
            self.assertIn(k, campos)

    def test_herramientas_nombradas_existen(self):
        import herramientas
        existentes = {t.name for t in herramientas.TOOLS}
        texto, _ = prompts.sistema()
        for h in HERRAMIENTAS:
            self.assertIn(h, existentes)
            self.assertIn(h, texto)

    def test_mensaje_usuario_inserta_evento(self):
        ev = json.dumps({"id": "opp999"})
        texto, version = prompts.mensaje_usuario(ev)
        self.assertIn("opp999", texto)
        self.assertNotIn("{evento_json}", texto)
        self.assertNotEqual(version, "sin-version")


if __name__ == "__main__":
    unittest.main()
