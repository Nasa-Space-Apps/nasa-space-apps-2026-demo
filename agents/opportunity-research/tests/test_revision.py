"""Pruebas gratis de la revisión: el revisor solo puede conservar datos, no inventarlos (sin red ni Claude)."""
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import proveedores  # noqa: E402
import revision  # noqa: E402
from esquema import Dato, Dossier, FuenteNueva  # noqa: E402


def dato(n, url="https://a.org/x", cita=None):
    return Dato(afirmacion=f"hecho {n}", fuente_url=url, cita=cita or f"cita {n}", confianza="alta")


def dossier(datos, contexto="borrador", fuentes=None):
    return Dossier(evento_id="e1", titulo="t", contexto_ampliado=contexto, datos_reales=datos, fuentes_nuevas=fuentes or [],
                   contradicciones=["c0"], huecos=["h0"], ideas_visuales=["i0"])


def rev(indices, contexto="revisado", **kw):
    return revision.Revision(indices_datos_a_conservar=indices, contexto_ampliado=contexto, **kw)


class FusionarTest(unittest.TestCase):
    def test_conserva_un_subconjunto_y_acepta_el_texto_nuevo(self):
        b = dossier([dato(1), dato(2), dato(3)])
        f, c = revision.fusionar(b, rev([0, 2], contradicciones_nuevas=["c1"], huecos_nuevos=["h1", "h2"]))
        self.assertEqual([x.afirmacion for x in f.datos_reales], ["hecho 1", "hecho 3"])
        self.assertEqual(f.contexto_ampliado, "revisado")
        self.assertEqual(f.contradicciones, ["c0", "c1"])
        self.assertEqual(f.huecos, ["h0", "h1", "h2"])
        self.assertEqual((c["contradicciones_nuevas"], c["huecos_nuevos"]), (1, 2))

    def test_ignora_indices_invalidos_y_repetidos(self):
        b = dossier([dato(1), dato(2)])
        f, c = revision.fusionar(b, rev([0, 0, 7, -1]))
        self.assertEqual(len(f.datos_reales), 1)
        self.assertEqual(c["indices_invalidos"], 3)

    def test_los_datos_conservados_son_los_del_borrador_sin_cambios(self):
        b = dossier([dato(1), dato(2)])
        f, _ = revision.fusionar(b, rev([1, 0]))
        self.assertEqual([(x.fuente_url, x.cita) for x in f.datos_reales], [(x.fuente_url, x.cita) for x in b.datos_reales])

    def test_no_puede_cambiar_las_fuentes_nuevas(self):
        fuente = FuenteNueva(titulo="a", url="https://www.jpl.nasa.gov/x", tipo="oficial NASA/JPL")
        b = dossier([dato(1)], fuentes=[fuente])
        f, _ = revision.fusionar(b, rev([0]))
        self.assertEqual(len(f.fuentes_nuevas), 1)

    def test_la_confianza_no_la_sube_el_revisor(self):
        b = dossier([dato(1)])
        b.datos_reales[0].confianza = "baja"
        f, _ = revision.fusionar(b, rev([0]))
        self.assertEqual(f.datos_reales[0].confianza, "baja")

    def test_contexto_vacio_conserva_el_del_borrador(self):
        f, _ = revision.fusionar(dossier([dato(1)], contexto="original"), rev([0], contexto="  "))
        self.assertEqual(f.contexto_ampliado, "original")

    def test_la_entrada_numera_los_datos(self):
        entrada = revision.armar_entrada({"id": "e1", "titulo": "t"}, dossier([dato(1), dato(2)]))
        self.assertIn("[0] hecho 1", entrada)
        self.assertIn("[1] hecho 2", entrada)


class RevisorConfigTest(unittest.TestCase):
    def entorno(self, **kw):
        base = {k: v for k, v in os.environ.items() if not k.startswith(("ANTHROPIC", "AWS_", "BEDROCK", "CLAUDE_CODE", "PROVEEDOR", "MODELO"))}
        base.update(kw)
        return mock.patch.dict(os.environ, base, clear=True)

    def test_bedrock_trae_revisor_opus_por_defecto(self):
        with self.entorno():
            p = proveedores.resolver("bedrock")
            self.assertIn("opus", p.modelo_revisor)
            self.assertIn("sonnet", p.modelo)

    def test_plan_y_api_no_tienen_revisor(self):
        with self.entorno(ANTHROPIC_API_KEY="x"):
            self.assertIsNone(proveedores.resolver("plan").modelo_revisor)
            self.assertIsNone(proveedores.resolver("api").modelo_revisor)

    def test_ninguno_desactiva_el_revisor(self):
        with self.entorno(BEDROCK_MODELO_REVISOR="ninguno"):
            self.assertIsNone(proveedores.resolver("bedrock").modelo_revisor)


if __name__ == "__main__":
    unittest.main()
