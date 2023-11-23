import { Worker, isMainThread, parentPort } from 'worker_threads';
import { AxiosHeaders } from "axios";

const axios = require('axios');

const headers: Partial<AxiosHeaders> = {
  'Accept': '*/*',
  'Accept-Language': 'pt-BR',
  'Authorization': '---',
  'Client-Id': '---',
  'Client-Integrity': '---',
  'Client-Session-Id': '---',
  'Client-Version':'---',
  'Connection': 'keep-alive',
  'Content-Type': 'text/plain;charset=UTF-8',
  'Origin': 'https://www.twitch.tv',
  'Referer': 'https://www.twitch.tv/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'X-Device-Id': '---',
  'sec-ch-ua': '"Microsoft Edge";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '',
};

function generateRandomHexCode() {
  const length = 32;
  const characters = '0123456789abcdef';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

const getBody = () => {
  const randomHexCode = generateRandomHexCode();
  return [
    {
      "operationName": "RedeemCustomReward",
      "variables": {
        "input": {
          "channelID": "477293968",
          "cost": 50,
          "prompt": null,
          "rewardID": "37130f3d-f42d-464d-8bf0-d4d39b5a88af",
          "title": "Bala Halls",
          "transactionID": randomHexCode
        }
      },
      "extensions": {
        "persistedQuery": {
          "version": 1,
          "sha256Hash": "d56249a7adb4978898ea3412e196688d4ac3cea1c0c2dfd65561d229ea5dcc42"
        }
      }
    }
  ];
}

if (isMainThread) {
  const numThreads = 100;
  const intervalBetweenThreads = 80;

  let threadCounter = 0;

  const createThread = () => {
    if (threadCounter < numThreads) {
      const worker = new Worker(__filename);

      worker.postMessage('Iniciar solicitação');
      threadCounter++;

      setTimeout(createThread, intervalBetweenThreads);
    }
  };

  createThread();

  let threadsCompleted = 0;
  parentPort?.on('message', (message) => {
    if (message === 'Solicitação concluída') {
      threadsCompleted++;
      if (threadsCompleted === numThreads) {
        console.log('Todas as solicitações foram concluídas.');
      }
    }
  });
} else {
  parentPort?.on('message', async (message) => {
    if (message === 'Iniciar solicitação') {
      try {
        const res = await axios.post('https://gql.twitch.tv/gql', getBody(), { headers });
        console.log(JSON.stringify(res.data));
        parentPort?.postMessage('Solicitação concluída');
      } catch (error) {
        console.error('Erro na solicitação:', error);
      }
    }
  });
}