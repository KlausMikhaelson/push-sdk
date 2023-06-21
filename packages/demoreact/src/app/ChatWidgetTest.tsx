import React, { useContext, useEffect, useState } from 'react';
import { ChatAndNotificationWidget, PUSH_TABS } from '@pushprotocol/uiweb';
import { EnvContext, Web3Context } from './context';
import * as PushAPI from '@pushprotocol/restapi';
import { IUser } from '@pushprotocol/restapi';




export const ChatWidgetTest = () => {

  const { account, library } = useContext<any>(Web3Context);
  const librarySigner = library.getSigner();
  const [pvtKey,setPvtKey] = useState<string>('');
  const {env} = useContext<any>(EnvContext);

  useEffect(()=>{
    (async()=>{
        const user = await PushAPI.user.get({ account: account, env });
        const pvtkey = null;
        console.log(user)
        if (user?.encryptedPrivateKey) {
            console.log("here")
            const response = await PushAPI.chat.decryptPGPKey({
                encryptedPGPPrivateKey: (user as IUser).encryptedPrivateKey,
                account: account,
                signer: librarySigner,
                env,
                toUpgrade: true,
              });
          setPvtKey(response)
        }
    })();
   
  },[account])
  return (
    <ChatAndNotificationWidget
      account={account}
      env={env}
      decryptedPgpPvtKey={pvtKey}
      signer={librarySigner}
      // activeTab={PUSH_TABS.APP_NOTIFICATIONS}
      // activeChat='eip155:0xcc45BaEb518CcbC7f8B01f8D7665fbe3A0D59f07'
    />
  );
};