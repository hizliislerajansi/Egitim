import {kittenBridge} from './scripts/kittenBridge.js';
import {emaBridge} from './scripts/emaBridge.js';
import {lessonMediaBridge} from './scripts/lessonMediaBridge.js';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import crypto from 'node:crypto';
import https from 'node:https';

/**
 * Microsoft Edge Read-Aloud Neural TTS (tr-TR-AhmetNeural & en-US-AndrewMultilingualNeural)
 * Sıfır API anahtarıyla gerçek insan kalitesinde Genç Erkek Sesi (24kHz MP3) üretir.
 */
function synthesizeEdgeNeuralMp3(text: string, lang: string = 'tr-TR', voice?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const trustedToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    const winEpoch = 11644473600;
    const ticks = Math.floor((Date.now() / 1000 + winEpoch) / 300) * 300 * 1e7;
    const strToHash = `${ticks.toFixed(0)}${trustedToken}`;
    const secMsGec = crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
    const connectId = crypto.randomUUID().replace(/-/g, '');

    const selectedVoice =
      voice && voice.includes('Neural')
        ? voice
        : lang.toLowerCase().startsWith('en')
        ? 'en-US-AndrewMultilingualNeural'
        : 'tr-TR-AhmetNeural';

    const xmlLang = lang.toLowerCase().startsWith('en') ? 'en-US' : 'tr-TR';
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .slice(0, 2500);

    const wsKey = crypto.randomBytes(16).toString('base64');
    const req = https.request({
      hostname: 'speech.platform.bing.com',
      port: 443,
      path: `/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${trustedToken}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=${connectId}`,
      method: 'GET',
      headers: {
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        Upgrade: 'websocket',
        Connection: 'Upgrade',
        'Sec-WebSocket-Key': wsKey,
        'Sec-WebSocket-Version': '13'
      },
      timeout: 8000
    });

    function sendWsTextFrame(socket: any, payload: string) {
      const data = Buffer.from(payload, 'utf8');
      const mask = crypto.randomBytes(4);
      let header: Buffer;
      if (data.length < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81;
        header[1] = 0x80 | data.length;
      } else if (data.length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 0x80 | 126;
        header.writeUInt16BE(data.length, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(data.length), 2);
      }
      const masked = Buffer.alloc(data.length);
      for (let i = 0; i < data.length; i++) {
        masked[i] = data[i] ^ mask[i % 4];
      }
      socket.write(Buffer.concat([header, mask, masked]));
    }

    req.on('upgrade', (_res, socket) => {
      const audioChunks: Buffer[] = [];
      let recvBuf = Buffer.alloc(0);
      let settled = false;

      const configMsg =
        `X-Timestamp:${new Date().toISOString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });
      sendWsTextFrame(socket, configMsg);

      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${xmlLang}'>` +
        `<voice name='${selectedVoice}'>` +
        `<prosody pitch='+4Hz' rate='+5%' volume='+0%'>${escapedText}</prosody>` +
        `</voice></speak>`;

      const ssmlMsg =
        `X-RequestId:${connectId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${new Date().toISOString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;
      sendWsTextFrame(socket, ssmlMsg);

      socket.on('data', (chunk: Buffer) => {
        recvBuf = Buffer.concat([recvBuf, chunk]);
        while (recvBuf.length >= 2) {
          const firstByte = recvBuf[0];
          const secondByte = recvBuf[1];
          const opcode = firstByte & 0x0f;
          const isMasked = (secondByte & 0x80) !== 0;
          let payloadLen = secondByte & 0x7f;
          let offset = 2;

          if (payloadLen === 126) {
            if (recvBuf.length < 4) return;
            payloadLen = recvBuf.readUInt16BE(2);
            offset = 4;
          } else if (payloadLen === 127) {
            if (recvBuf.length < 10) return;
            payloadLen = Number(recvBuf.readBigUInt64BE(2));
            offset = 10;
          }

          if (isMasked) offset += 4;
          if (recvBuf.length < offset + payloadLen) return;

          const frameData = recvBuf.subarray(offset, offset + payloadLen);
          recvBuf = recvBuf.subarray(offset + payloadLen);

          if (opcode === 0x02 && frameData.length >= 2) {
            const headerLen = frameData.readUInt16BE(0);
            const headerText = frameData.subarray(2, 2 + headerLen).toString('utf8');
            if (headerText.includes('Path:audio')) {
              audioChunks.push(frameData.subarray(2 + headerLen));
            }
          } else if (opcode === 0x01) {
            const txt = frameData.toString('utf8');
            if (txt.includes('Path:turn.end') && !settled) {
              settled = true;
              socket.end();
              resolve(Buffer.concat(audioChunks));
            }
          } else if (opcode === 0x08 && !settled) {
            settled = true;
            socket.end();
            if (audioChunks.length > 0) resolve(Buffer.concat(audioChunks));
            else reject(new Error('Edge Neural WebSocket kapandı.'));
          }
        }
      });

      socket.on('error', err => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Edge Neural TTS zaman aşımı'));
    });
    req.end();
  });
}

const apiProxy = {
  '^/api/dictionary/[a-zA-Z-]{1,80}$': {
    target: 'https://api.dictionaryapi.dev',
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 12000,
    rewrite: (path: string) => path.replace('/api/dictionary/', '/api/v2/entries/en/')
  },
  '/api/google_tts': {
    target: 'https://translate.google.com',
    changeOrigin: true,
    configure(proxy: any) { proxy.on('proxyReq', (request: any) => { request.removeHeader('origin'); request.removeHeader('referer'); }); },
    timeout: 15000,
    proxyTimeout: 12000,
    rewrite: (path: string) => path.replace(/^\/api\/google_tts/, '/translate_tts')
  }
};

export default defineConfig({
  plugins: [kittenBridge(),lessonMediaBridge(),emaBridge(),
    react(),
    {
      name: 'edge-neural-young-male-tts',
      configureServer(server) {
        server.middlewares.use('/api/edge_neural_tts', async (req, res) => {
          try {
            const url = new URL(req.url || '', 'http://127.0.0.1');
            const text = url.searchParams.get('q') || '';
            const lang = url.searchParams.get('lang') || 'tr-TR';
            const voice = url.searchParams.get('voice') || 'tr-TR-AhmetNeural';
            if (!text.trim()) {
              res.statusCode = 400;
              res.end('Missing text');
              return;
            }
            const mp3Buffer = await synthesizeEdgeNeuralMp3(text, lang, voice);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'no-store');
            res.end(mp3Buffer);
          } catch (err: any) {
            res.statusCode = 502;
            res.end(String(err?.message || 'TTS error'));
          }
        });
      }
    }
  ],
  server: { host: '127.0.0.1', proxy: apiProxy },
  preview: { host: '127.0.0.1', proxy: apiProxy }
});
