"""Mejoras de velocidad y costo del agente: prompt v4 seleccionable y tope de pensamiento del revisor (sin red ni Claude)."""
import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import prompts  # noqa: E402
import proveedores  # noqa: E402
import revision  # noqa: E402
from esquema import Dato, Dossier  # noqa: E402


def entorno_limpio(**kw):
    base = {k: v for k, v in os.environ.items() if k not in ("PROMPT_INVESTIGADOR",)}
    base.update(kw)
    return mock.patch.dict(os.environ, base, clear=True)


class PromptInvestigador(unittest.TestCase):
    def test_por_defecto_es_la_v4_con_lecturas_en_paralelo_y_palabras(self):
        with entorno_limpio():
            texto, version = prompts.sistema()
        self.assertEqual(version, "4")
        self.assertIn("MISMO turno", texto)
        self.assertIn("palabras", texto)
        self.assertIn("máximo unas 8 llamadas", texto)

    def test_se_puede_volver_a_la_v3(self):
        with entorno_limpio(PROMPT_INVESTIGADOR="investigador_v3"):
            texto, version = prompts.sistema()
        self.assertEqual(version, "3")
        self.assertIn("máximo unas 15 llamadas", texto)
        self.assertNotIn("MISMO turno", texto)

    def test_ambas_versiones_conservan_las_reglas_de_verificacion(self):
        for nombre in ("investigador", "investigador_v3"):
            texto, _ = prompts.cargar(nombre)
            self.assertIn("LITERAL", texto)
            self.assertIn("contradicciones", texto)
            self.assertIn("huecos", texto)


SEMILLA = "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/"


class FuentesSemilla(unittest.TestCase):
    def test_el_contexto_trae_las_fuentes_semilla_de_la_ficha(self):
        import mision
        with mock.patch.object(mision, "cargar_ficha", return_value={"nombre": "Spirit", "fuentes_semilla": [SEMILLA]}):
            c = mision.contexto_prompt("spirit", None, None)
        self.assertEqual(c["fuentes_semilla"], [SEMILLA])

    def test_sin_semilla_el_contexto_no_cambia(self):
        import mision
        with mock.patch.object(mision, "cargar_ficha", return_value={"nombre": "Spirit"}):
            c = mision.contexto_prompt("spirit", None, None)
        self.assertNotIn("fuentes_semilla", c)

    def test_el_evento_para_el_modelo_lleva_la_semilla_y_sigue_sin_fuentes_extra(self):
        import json
        import agente
        ev = {"id": "spi001", "titulo": "t", "fuentes_extra": ["x"]}
        enviado = json.loads(agente.evento_json(ev, {"fuentes_semilla": [SEMILLA]}))
        self.assertEqual(enviado["fuentes_semilla_de_la_mision"], [SEMILLA])
        self.assertEqual(enviado["id"], "spi001")
        self.assertNotIn("fuentes_extra", enviado)

    def test_sin_semilla_el_evento_va_como_antes(self):
        import json
        import agente
        ev = {"id": "spi001", "titulo": "t", "fuentes_extra": ["x"]}
        self.assertEqual(json.loads(agente.evento_json(ev, None)), {"id": "spi001", "titulo": "t"})


class EsfuerzoRevisor(unittest.TestCase):
    def capturar_opciones(self):
        capturadas = {}

        async def falso_query(prompt, options):
            capturadas["opts"] = options
            return
            yield  # noqa: B901 (generador asíncrono vacío)

        prov = proveedores.Proveedor("bedrock", "m", "e", True, {}, "revisor-x")
        borrador = Dossier(evento_id="e1", titulo="t", contexto_ampliado="c", fuentes_nuevas=[], contradicciones=[], huecos=[],
                           ideas_visuales=[], datos_reales=[Dato(afirmacion="a", fuente_url="https://a.org/x", cita="q", confianza="alta")])
        with mock.patch.object(revision, "query", falso_query), mock.patch.object(proveedores, "aplicar"):
            asyncio.run(revision.revisar({"id": "e1"}, borrador, prov))
        return capturadas["opts"]

    def test_el_revisor_corre_con_esfuerzo_medio_por_defecto(self):
        opts = self.capturar_opciones()
        self.assertEqual(opts.effort, "medium")
        self.assertIsNone(opts.max_thinking_tokens)  # obsoleto e ignorado por Opus: no se usa

    def test_default_quita_el_ajuste(self):
        with mock.patch.object(revision, "ESFUERZO_REVISOR", "default"):
            opts = self.capturar_opciones()
        self.assertIsNone(opts.effort)

    def test_otro_nivel_se_respeta(self):
        with mock.patch.object(revision, "ESFUERZO_REVISOR", "high"):
            opts = self.capturar_opciones()
        self.assertEqual(opts.effort, "high")


if __name__ == "__main__":
    unittest.main()
