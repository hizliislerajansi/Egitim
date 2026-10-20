from pathlib import Path
import unittest,importlib.util
spec=importlib.util.spec_from_file_location('ema_server',Path(__file__).with_name('ema_server.py'))
server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)
class Validation(unittest.TestCase):
 def test_turkish_text(self):self.assertEqual(server.valid_payload({'text':'Merhaba','lang':'tr-TR'}),'Merhaba')
 def test_rejects_unsupported_and_unbounded_input(self):
  for payload in ({'text':'hello','lang':'en-US'},{'text':'x'*4001},{'text':''},[],{'text':12}):
   with self.assertRaises(ValueError):server.valid_payload(payload)
if __name__=='__main__':unittest.main()
