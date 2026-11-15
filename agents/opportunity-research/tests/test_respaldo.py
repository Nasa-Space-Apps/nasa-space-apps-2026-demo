"""Pruebas gratis del respaldo entre proveedores (se simula el fallo; no hay red ni Claude)."""
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import agente  # noqa: E402
import proveedores  # noqa: E402


def prov(nombre):
    return proveedores.Proveedor(nombre, "m", nombre, False)


class RespaldoTest(unittest.TestCase):
    def test_bedrock_falla_y_usa_el_plan(self):
        llamados = []

        async def falso(ev, turnos, p):
            llamados.append(p.nombre)
            if p.nombre == "bedrock":
                raise agente.ErrorProveedor("403 pago invalido")
            return "dossier", "plan", {}

        with mock.patch.object(agente, "investigar", falso):
            d, modo, met = agente.ejecutar({}, 5, [prov("bedrock"), prov("plan")])
        self.assertEqual(llamados, ["bedrock", "plan"])
        self.assertEqual(met["fallback_desde"], "bedrock")

    def test_sin_respaldo_termina_con_mensaje(self):
        async def falso(ev, turnos, p):
            raise agente.ErrorProveedor("403")

        with mock.patch.object(agente, "investigar", falso):
            with self.assertRaises(SystemExit):
                agente.ejecutar({}, 5, [prov("bedrock")])

    def test_si_el_primero_funciona_no_llama_al_respaldo(self):
        llamados = []

        async def falso(ev, turnos, p):
            llamados.append(p.nombre)
            return "dossier", "bedrock", {}

        with mock.patch.object(agente, "investigar", falso):
            _, _, met = agente.ejecutar({}, 5, [prov("bedrock"), prov("plan")])
        self.assertEqual(llamados, ["bedrock"])
        self.assertNotIn("fallback_desde", met)

    def test_excepcion_del_sdk_antes_de_empezar_es_error_de_proveedor(self):
        async def query_roto(**kw):
            raise RuntimeError("AWS authentication failed")
            yield  # pragma: no cover

        import asyncio
        with mock.patch.object(agente, "query", query_roto):
            with self.assertRaises(agente.ErrorProveedor):
                asyncio.run(agente.investigar({"id": "x"}, 3, prov("bedrock")))


if __name__ == "__main__":
    unittest.main()
