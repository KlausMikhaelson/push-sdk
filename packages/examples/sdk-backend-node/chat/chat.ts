import { CONSTANTS, PushAPI } from '@pushprotocol/restapi';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { config } from '../config';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { STREAM } from '@pushprotocol/restapi/src/lib/pushstream/pushStreamTypes';
import { PushStream } from '@pushprotocol/restapi/src/lib/pushstream/PushStream';

// CONFIGS
const { env, showAPIResponse } = config;

/***************** SAMPLE SIGNER GENERATION *********************/
// Uing VIEM
// Random Wallet Signers
const signer = createWalletClient({
  account: privateKeyToAccount(generatePrivateKey()),
  chain: sepolia,
  transport: http(),
});
const signerAddress = signer.account.address;
const secondSigner = createWalletClient({
  account: privateKeyToAccount(generatePrivateKey()),
  chain: sepolia,
  transport: http(),
});
const secondSignerAddress = secondSigner.account.address;
const thirdSigner = createWalletClient({
  account: privateKeyToAccount(generatePrivateKey()),
  chain: sepolia,
  transport: http(),
});
const thirdSignerAddress = thirdSigner.account.address;

// Dummy Wallet Addresses
const randomWallet1 = privateKeyToAccount(generatePrivateKey()).address;
const randomWallet2 = privateKeyToAccount(generatePrivateKey()).address;
const randomWallet3 = privateKeyToAccount(generatePrivateKey()).address;
/****************************************************************/

/***************** SAMPLE GROUP DATA ****************************/
const groupName = uniqueNamesGenerator({
  dictionaries: [adjectives, colors, animals],
});
const groupDescription = uniqueNamesGenerator({
  dictionaries: [adjectives, colors, animals],
});
const groupImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvklEQVR4AcXBsW2FMBiF0Y8r3GQb6jeBxRauYRpo4yGQkMd4A7kg7Z/GUfSKe8703fKDkTATZsJsrr0RlZSJ9r4RLayMvLmJjnQS1d6IhJkwE2bT13U/DBzp5BN73xgRZsJMmM1HOolqb/yWiWpvjJSUiRZWopIykTATZsJs5g+1N6KSMiO1N/5DmAkzYTa9Lh6MhJkwE2ZzSZlo7xvRwson3txERzqJhJkwE2bT6+JhoKTMJ2pvjAgzYSbMfgDlXixqjH6gRgAAAABJRU5ErkJggg==';
/***************** SAMPLE GROUP DATA ****************************/

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const eventlistener = async (
  stream: PushStream,
  eventName: string
): Promise<void> => {
  stream.on(eventName, (data: any) => {
    if (showAPIResponse) {
      console.log('Stream Event Received');
      console.log(data);
      console.log('\n');
    }
  });
};

export const runChatClassUseCases = async (): Promise<void> => {
  const userAlice = await PushAPI.initialize(signer, { env });

  const stream = await userAlice.initStream(
    [CONSTANTS.STREAM.CHAT, CONSTANTS.STREAM.CHAT_OPS],
    {
      // stream supports other products as well, such as STREAM.CHAT, STREAM.CHAT_OPS
      // more info can be found at push.org/docs/chat

      filter: {
        channels: ['*'],
        chats: ['*'],
      },
      connection: {
        auto: true, // should connection be automatic, else need to call stream.connect();
        retries: 3, // number of retries in case of error
      },
      raw: true, // enable true to show all data
    }
  );

  stream.on(CONSTANTS.STREAM.CONNECT, (a) => {
    console.log('Stream Connected');
  });

  await stream.connect();

  stream.on(CONSTANTS.STREAM.DISCONNECT, () => {
    console.log('Stream Disconnected');
  });

  const userBob = await PushAPI.initialize(secondSigner, { env });
  const userKate = await PushAPI.initialize(thirdSigner, { env });

  // Listen stream events to receive websocket events
  console.log(`Listening ${CONSTANTS.STREAM.CHAT} Events`);
  eventlistener(stream, CONSTANTS.STREAM.CHAT);
  console.log(`Listening ${CONSTANTS.STREAM.CHAT_OPS} Events`);
  eventlistener(stream, CONSTANTS.STREAM.CHAT_OPS);
  console.log('\n\n');

  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.list');
  const aliceChats = await userAlice.chat.list(CONSTANTS.CHAT.LIST_TYPE.CHATS);
  const aliceRequests = await userAlice.chat.list(
    CONSTANTS.CHAT.LIST_TYPE.REQUESTS
  );
  if (showAPIResponse) {
    console.log(aliceChats);
    console.log(aliceRequests);
  }
  console.log('PushAPI.chat.list | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.latest');
  const aliceLatestChatWithBob = await userAlice.chat.latest(
    secondSignerAddress
  );
  if (showAPIResponse) {
    console.log(aliceLatestChatWithBob);
  }
  console.log('PushAPI.chat.latest | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.history');
  const aliceChatHistoryWithBob = await userAlice.chat.history(
    secondSignerAddress
  );
  if (showAPIResponse) {
    console.log(aliceChatHistoryWithBob);
  }
  console.log('PushAPI.chat.history | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.send');
  const aliceMessagesBob = await userAlice.chat.send(secondSignerAddress, {
    content: 'Hello Bob!',
    type: CONSTANTS.CHAT.MESSAGE_TYPE.TEXT,
  });
  if (showAPIResponse) {
    console.log(aliceMessagesBob);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.chat.send | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.accept');
  const bobAcceptsRequest = await userBob.chat.accept(signerAddress);
  if (showAPIResponse) {
    console.log(bobAcceptsRequest);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.chat.accept | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.reject');
  await userKate.chat.send(signerAddress, {
    content: 'Sending malicious message',
    type: CONSTANTS.CHAT.MESSAGE_TYPE.TEXT,
  });
  const AliceRejectsRequest = await userAlice.chat.reject(thirdSignerAddress);
  if (showAPIResponse) {
    console.log(AliceRejectsRequest);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.chat.reject | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.block');
  const AliceBlocksBob = await userAlice.chat.block([secondSignerAddress]);
  if (showAPIResponse) {
    console.log(AliceBlocksBob);
  }
  console.log('PushAPI.chat.block | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.chat.unblock');
  const AliceUnblocksBob = await userAlice.chat.unblock([secondSignerAddress]);
  if (showAPIResponse) {
    console.log(AliceUnblocksBob);
  }
  console.log('PushAPI.chat.unblock | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.create');
  const createdGroup = await userAlice.chat.group.create(groupName, {
    description: groupDescription,
    image: groupImage,
    members: [randomWallet1, randomWallet2],
    admins: [],
    private: false,
  });
  const groupChatId = createdGroup.chatId; // to be used in other examples
  if (showAPIResponse) {
    console.log(createdGroup);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.create | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.permissions');
  const grouppermissions = await userAlice.chat.group.permissions(groupChatId);
  if (showAPIResponse) {
    console.log(grouppermissions);
  }
  console.log('PushAPI.group.permissions | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.info');
  const groupInfo = await userAlice.chat.group.info(groupChatId);
  if (showAPIResponse) {
    console.log(groupInfo);
  }
  console.log('PushAPI.group.info | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.update');
  const updatedGroup = await userAlice.chat.group.update(groupChatId, {
    description: 'Updated Description',
  });
  if (showAPIResponse) {
    console.log(updatedGroup);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.update | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.add');
  const addMember = await userAlice.chat.group.add(groupChatId, {
    role: 'MEMBER',
    accounts: [randomWallet3],
  });
  if (showAPIResponse) {
    console.log(addMember);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.add | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.remove');
  const removeMember = await userAlice.chat.group.remove(groupChatId, {
    role: 'MEMBER',
    accounts: [randomWallet3],
  });
  if (showAPIResponse) {
    console.log(removeMember);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.remove | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.join');
  const joinGrp = await userBob.chat.group.join(groupChatId);
  if (showAPIResponse) {
    console.log(joinGrp);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.join | Response - 200 OK\n\n');
  //-------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.leave');
  const leaveGrp = await userBob.chat.group.leave(groupChatId);
  if (showAPIResponse) {
    console.log(leaveGrp);
  }
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.leave | Response - 200 OK\n\n');
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  console.log('PushAPI.group.reject');
  const sampleGrp = await userAlice.chat.group.create('Sample Grp', {
    description: groupDescription,
    image: groupImage,
    members: [secondSignerAddress], // invite bob
    admins: [],
    private: true,
  });
  await userBob.chat.group.reject(sampleGrp.chatId);
  await delay(2000); // Delay added to log the events in order
  console.log('PushAPI.group.reject | Response - 200 OK\n\n');
};
