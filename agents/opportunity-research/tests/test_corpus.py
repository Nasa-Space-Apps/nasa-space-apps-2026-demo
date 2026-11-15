"""Prueba gratis: guardar el corpus no pisa lo que escribió otro proceso (lotes en paralelo)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent.parent))

import herramientas as H  # noqa: E402


class CorpusTest(unittest.TestCase):
    def test_se_mezcla_con_lo_que_otro_proceso_escribio(self):
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "corpus.json"
            f.write_text(json.dumps({"https://otro.org": "texto de otro proceso"}), encoding="utf-8")
            with mock.patch.object(H, "CORPUS_F", f), mock.patch.dict(H.CORPUS, {}, clear=True):
                H.guardar_corpus("https://mio.org", "texto mío")
                en_disco = json.loads(f.read_text(encoding="utf-8"))
            self.assertEqual(en_disco["https://otro.org"], "texto de otro proceso")
            self.assertEqual(en_disco["https://mio.org"], "texto mío")
            self.assertEqual(list(Path(tmp).glob("*.tmp")), [])

    def test_ignora_urls_o_textos_vacios(self):
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "corpus.json"
            with mock.patch.object(H, "CORPUS_F", f), mock.patch.dict(H.CORPUS, {}, clear=True):
                H.guardar_corpus("", "x")
                H.guardar_corpus("https://a.org", "")
            self.assertFalse(f.exists())


if __name__ == "__main__":
    unittest.main()
