"""Pruebas gratis del orden por misión: cada misión tiene su carpeta y sus salidas no se mezclan (sin red ni Claude)."""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import agente  # noqa: E402
import mision as misiones  # noqa: E402
import prompts  # noqa: E402
from esquema import Dato, Dossier  # noqa: E402


def entorno_temporal(tmp: Path):
    """Raíz de repo falsa: misiones/ y timelines_v0/ dentro de una carpeta temporal."""
    return mock.patch.multiple(misiones, RAIZ=tmp, MISIONES=tmp / "misiones", TIMELINES=tmp / "timelines_v0")


class RutasTest(unittest.TestCase):
    def test_rutas_por_defecto_estan_dentro_de_la_carpeta_de_la_mision(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)):
            r = misiones.rutas("spirit")
            self.assertEqual(r["dossiers"], Path(t) / "misiones" / "spirit" / "dossiers")
            self.assertEqual(r["base"], Path(t) / "timelines_v0" / "linea_de_tiempo_spirit.json")
            for k in ("base_trabajo", "seleccion", "lotes", "informes", "historia"):
                self.assertTrue(str(r[k]).startswith(str(Path(t) / "misiones" / "spirit")), k)

    def test_dos_misiones_nunca_comparten_carpeta(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)):
            a, b = misiones.rutas("spirit"), misiones.rutas("insight")
            for k in ("dossiers", "lotes", "seleccion", "informes", "historia", "base_trabajo", "base"):
                self.assertNotEqual(a[k], b[k], k)

    def test_id_invalido_se_rechaza(self):
        for malo in ("", "Spirit", "mi mision", "../x", "a", "1abc"):
            with self.assertRaises(ValueError, msg=malo):
                misiones.validar_id(malo)

    def test_crear_carpetas_crea_las_seis_subcarpetas(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)):
            misiones.crear_carpetas("insight")
            for k in misiones.SUBCARPETAS:
                self.assertTrue((Path(t) / "misiones" / "insight" / k).is_dir(), k)

    def test_ficha_puede_apuntar_a_carpetas_heredadas(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)):
            (Path(t) / "misiones" / "vieja").mkdir(parents=True)
            (Path(t) / "misiones" / "vieja" / "ficha.json").write_text(json.dumps({"rutas": {"dossiers": "agents/x/salida"}}), encoding="utf-8")
            r = misiones.rutas("vieja")
            self.assertEqual(r["dossiers"], (Path(t) / "agents" / "x" / "salida").resolve())
            self.assertEqual(r["lotes"], Path(t) / "misiones" / "vieja" / "lotes")  # lo demás sigue el orden normal


class ContextoTest(unittest.TestCase):
    def test_sale_del_bloque_mision_de_la_linea_de_tiempo(self):
        c = misiones.contexto_prompt(None, {"mision": {"nombre_completo": "Mars Exploration Rover A", "tipo": "rover", "cuerpo": "Marte"}})
        self.assertEqual(c["mision"], "Mars Exploration Rover A (rover, Marte)")

    def test_la_ficha_manda_sobre_el_bloque(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)):
            (Path(t) / "misiones" / "x1").mkdir(parents=True)
            (Path(t) / "misiones" / "x1" / "ficha.json").write_text(json.dumps({"nombre": "Misión X", "publico": "público Z"}), encoding="utf-8")
            c = misiones.contexto_prompt("x1", {"mision": {"nombre_completo": "Otra"}})
            self.assertEqual((c["mision"], c["publico"]), ("Misión X", "público Z"))

    def test_sin_datos_usa_valores_neutros(self):
        c = misiones.contexto_prompt(None, None)
        self.assertEqual(c["mision"], "la misión")
        self.assertIn("5.º de secundaria", c["publico"])


class PromptsNeutrosTest(unittest.TestCase):
    def test_el_prompt_usa_la_mision_pedida_y_no_dice_opportunity(self):
        texto, _ = prompts.sistema({"mision": "Mars Exploration Rover A (rover, Marte)", "publico": "adultos"})
        self.assertIn("Mars Exploration Rover A", texto)
        self.assertIn("adultos", texto)
        self.assertNotIn("Opportunity", texto)
        self.assertNotIn("{mision}", texto)
        self.assertNotIn("{publico}", texto)

    def test_el_revisor_tambien_es_neutro(self):
        texto, _ = prompts.cargar("revisor", {"mision": "InSight (aterrizador, Marte)"})
        self.assertIn("InSight", texto)
        self.assertNotIn("Opportunity", texto)
        self.assertNotIn("{mision}", texto)


class EnrutadoDelAgenteTest(unittest.TestCase):
    """Con --mision, el dossier se escribe en misiones/<id>/dossiers/ y en ningún otro lugar."""

    def correr(self, tmp: Path, mision: str):
        (tmp / "timelines_v0").mkdir(parents=True, exist_ok=True)
        (tmp / "timelines_v0" / f"linea_de_tiempo_{mision}.json").write_text(json.dumps({
            "mision": {"nombre_completo": "Misión de prueba", "tipo": "rover", "cuerpo": "Marte"},
            "eventos": [{"id": "pru001", "titulo": "t", "detalle": "d"}]}), encoding="utf-8")
        d = Dossier(evento_id="pru001", titulo="t", contexto_ampliado="c", datos_reales=[Dato(afirmacion="a", fuente_url="https://x.org", cita="q")],
                    fuentes_nuevas=[], contradicciones=[], huecos=[], ideas_visuales=[])
        visto = {}

        def falso(ev, turnos, cadena, contexto=None):
            visto["contexto"] = contexto
            return d, "modo de prueba", {"proveedor": "plan", "por_modelo": {}}

        argv = ["agente.py", "--mision", mision, "--evento", "pru001"]
        with entorno_temporal(tmp), mock.patch.object(sys, "argv", argv), mock.patch.object(agente, "ejecutar", falso), \
                mock.patch.object(agente, "BASE", tmp / "agente"), mock.patch.dict(os.environ, {"PROVEEDOR_LLM": "plan"}):
            agente.main()
        return visto

    def test_el_dossier_va_a_la_carpeta_de_su_mision(self):
        with tempfile.TemporaryDirectory() as t:
            visto = self.correr(Path(t), "mimision")
            self.assertTrue((Path(t) / "misiones" / "mimision" / "dossiers" / "pru001" / "dossier.json").exists())
            self.assertIn("Misión de prueba", visto["contexto"]["mision"])

    def test_dos_misiones_no_mezclan_sus_dossiers(self):
        with tempfile.TemporaryDirectory() as t:
            self.correr(Path(t), "mision_a")
            self.correr(Path(t), "mision_b")
            self.assertTrue((Path(t) / "misiones" / "mision_a" / "dossiers" / "pru001").exists())
            self.assertTrue((Path(t) / "misiones" / "mision_b" / "dossiers" / "pru001").exists())
            self.assertFalse((Path(t) / "agente" / "salida").exists())

    def test_un_evento_ya_procesado_no_se_repite(self):
        with tempfile.TemporaryDirectory() as t:
            self.correr(Path(t), "mimision")
            with self.assertRaises(SystemExit) as c:
                self.correr(Path(t), "mimision")
            self.assertEqual(c.exception.code, 2)

    def test_sin_linea_de_tiempo_base_pide_construirla(self):
        with tempfile.TemporaryDirectory() as t, entorno_temporal(Path(t)), mock.patch.object(sys, "argv", ["agente.py", "--mision", "nueva", "--evento", "x1"]):
            with self.assertRaises(SystemExit) as c:
                agente.main()
            self.assertIn("Fase 1", str(c.exception))


if __name__ == "__main__":
    unittest.main()
