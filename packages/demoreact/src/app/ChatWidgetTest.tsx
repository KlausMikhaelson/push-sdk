import React, { useContext, useEffect, useState } from 'react';
import { ChatWidget } from '@pushprotocol/uiweb';
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
    <ChatWidget
      account={account}
      env={env}
      decryptedPgpPvtKey={pvtKey}
    />
  );
};