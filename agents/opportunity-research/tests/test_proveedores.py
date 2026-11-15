"""Pruebas gratis de la selección de proveedor (sin red ni Claude)."""
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import proveedores  # noqa: E402


def entorno(**kw):
    """Entorno limpio de variables del agente + las indicadas."""
    base = {k: v for k, v in os.environ.items() if not k.startswith(("ANTHROPIC", "AWS_", "BEDROCK", "CLAUDE_CODE", "PROVEEDOR", "MODELO"))}
    base.update(kw)
    return mock.patch.dict(os.environ, base, clear=True)


class ProveedoresTest(unittest.TestCase):
    def test_sin_nada_usa_el_plan(self):
        with entorno():
            self.assertEqual(proveedores.resolver().nombre, "plan")

    def test_con_api_key_usa_api(self):
        with entorno(ANTHROPIC_API_KEY="x"):
            self.assertEqual(proveedores.resolver().nombre, "api")

    def test_variable_elige_bedrock(self):
        with entorno(PROVEEDOR_LLM="bedrock"):
            p = proveedores.resolver()
            self.assertEqual(p.nombre, "bedrock")
            self.assertEqual(p.env["CLAUDE_CODE_USE_BEDROCK"], "1")
            self.assertTrue(p.modelo.startswith("us.anthropic."))
            self.assertEqual(p.env["AWS_PROFILE"], "default")
            self.assertEqual(p.env["AWS_REGION"], "us-east-1")
            self.assertTrue(p.con_tope)

    def test_bedrock_no_arrastra_la_api_key(self):
        with entorno(ANTHROPIC_API_KEY="x", PROVEEDOR_LLM="bedrock"):
            p = proveedores.resolver()
            proveedores.aplicar(p)
            self.assertNotIn("ANTHROPIC_API_KEY", os.environ)

    def test_plan_limpia_rastros_de_bedrock(self):
        with entorno(CLAUDE_CODE_USE_BEDROCK="1", ANTHROPIC_MODEL="us.x"):
            proveedores.aplicar(proveedores.resolver("plan"))
            self.assertNotIn("CLAUDE_CODE_USE_BEDROCK", os.environ)
            self.assertNotIn("ANTHROPIC_MODEL", os.environ)

    def test_api_sin_clave_falla(self):
        with entorno():
            with self.assertRaises(ValueError):
                proveedores.resolver("api")

    def test_proveedor_desconocido_falla(self):
        with self.assertRaises(ValueError):
            proveedores.resolver("otro")

    def test_modelos_bedrock_configurables(self):
        with entorno(BEDROCK_MODELO="global.anthropic.claude-sonnet-5-5", BEDROCK_PROFILE="otro"):
            p = proveedores.resolver("bedrock")
            self.assertEqual(p.modelo, "global.anthropic.claude-sonnet-5-5")
            self.assertEqual(p.env["AWS_PROFILE"], "otro")


if __name__ == "__main__":
    unittest.main()
