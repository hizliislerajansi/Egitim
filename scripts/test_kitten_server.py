import http.client, json, threading, unittest
from kitten_server import Handler, valid_payload
from http.server import ThreadingHTTPServer

class LocalSpeechTests(unittest.TestCase):
    def test_input_bounds(self):
        for body in [None, {}, {'text':'Hello','lang':'tr-TR'}, {'text':'','lang':'en-US'}, {'text':'x'*4001,'lang':'en-US'}, {'text':'Hello','lang':'en-US','voice':'../secret'}]:
            with self.assertRaises(ValueError): valid_payload(body)
        self.assertEqual(valid_payload({'text':'Hello','lang':'en-US'}),('Hello','Jasper'))
    def test_http_guards(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            for headers,body,expected in [({},'{}',403),({'Origin':'https://other.test','X-LocalSpeech-Client':'DersPusulasi'},'{}',403),({'X-LocalSpeech-Client':'DersPusulasi'},'{}',415),({'X-LocalSpeech-Client':'DersPusulasi','Content-Type':'application/json'},json.dumps({'text':'Hello','lang':'en-US','voice':'../bad'}),400)]:
                client=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=5)
                client.request('POST','/synthesize',body,headers)
                response=client.getresponse();self.assertEqual(response.status,expected);response.read();client.close()
        finally:server.shutdown();server.server_close();thread.join()

if __name__=='__main__':unittest.main()
