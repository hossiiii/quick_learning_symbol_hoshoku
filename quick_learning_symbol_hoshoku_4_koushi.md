# 準備
以下リンクを別ウィンドウで開き、F12からコンソールを表示させる

https://sym-test-04.opening-line.jp:3001/node/health

# 環境構築
別ウィンドウで開いているF12コンソールに以下順番に入力していく
### 1.Symbol SDKの読み込み
```js
(script = document.createElement("script")).src = "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.3.js";
document.getElementsByTagName("head")[0].appendChild(script);

```
### 2.Symbol用の共通設定
```js
NODE = 'https://sym-test-04.opening-line.jp:3001';
sym = require("/node_modules/symbol-sdk");
repo = new sym.RepositoryFactoryHttp(NODE);
txRepo = repo.createTransactionRepository();
mosaicRepo = repo.createMosaicRepository();
accountRepo = repo.createAccountRepository();
(async () => {
  networkType = await repo.getNetworkType().toPromise();
  generationHash = await repo.getGenerationHash().toPromise();
  epochAdjustment = await repo.getEpochAdjustment().toPromise();
})();
getMosaicInfo = async function(userAddress) { // モザイク情報を参照する関数を作成
 accountInfo = await accountRepo.getAccountInfo(userAddress).toPromise();
 accountInfo.mosaics.forEach( async (mosaic) => {
   mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
   mosaicAmount = mosaic.amount.toString();
   divisibility = mosaicInfo.divisibility; //可分性
   restrictable = mosaicInfo.flags.restrictable; //制限設定の可否
   revokable = mosaicInfo.flags.revokable; //発行者からの還収可否
   supplyMutable = mosaicInfo.flags.supplyMutable; //供給量変更の可否
   transferable = mosaicInfo.flags.transferable; //第三者への譲渡可否
   if (divisibility > 0) {
   	if(mosaicAmount / 10**divisibility >= 1 ){
     displayAmount =
       mosaicAmount.slice(0, mosaicAmount.length - divisibility) +  "." + mosaicAmount.slice(-divisibility);		
   	} else{
     displayAmount =
       "0." + "0".repeat(divisibility-mosaicAmount.slice(-divisibility).length) + mosaicAmount.slice(-divisibility);	   		
   	}
 } else {
   displayAmount = mosaicAmount;
 }
   console.log("id:" + mosaic.id.toHex() + " amount:" + displayAmount + " addressHeight:" + mosaicInfo.startHeight.compact() + " ownerAddress: " + mosaicInfo.ownerAddress.address + " divisibility:" + divisibility + " restrictable:" + restrictable + " revokable:" + revokable + " supplyMutable:" + supplyMutable + " transferable:" + transferable);
 });
};
```
### 3-a.新規Aliceアカウント,Alice公開鍵クラス,Aliceアドレスクラスの作成
```js
alice = sym.Account.generateNewAccount(networkType);
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  alice.publicKey,
  networkType
);
console.log(alicePublicAccount);
aliceAddress = sym.Address.createFromRawAddress(
  alice.address.plain()
);
console.log(aliceAddress);
```
### 3-b.Aliceアカウントのインポート,Alice公開鍵クラス,Aliceアドレスクラスの作成
```js
alice = sym.Account.createFromPrivateKey(
  "YourPrivateKey",
  networkType
);
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  alice.publicKey,
  networkType
);
console.log(alicePublicAccount);
aliceAddress = sym.Address.createFromRawAddress(
  alice.address.plain()
);
console.log(aliceAddress);
```
### 4.Aliceアカウントへ500XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=500&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```
# アカウント情報確認
### 5.Aliceアカウント情報をSymbolエクスプローラーで表示する
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックしてアカウント情報を別タブで表示しておく
```

# ウォレットと連携
秘密鍵をウォレットにインポートしておく
```js
console.log(alice.privateKey);
```

# モザイク作成とネームスペース割り当て
暗号化メッセージで、参加者からメタバース名を送ってもらう。


# モザイク作成とネームスペース割り当て
参加者数とモザイク数(暗号メッセージが全て届いてから数をカウントする)
```js
list_amount = 参加人数
star_amount = 3
```

手札モザイクの作成*5
```js
supplyMutable = true; //供給量変更の可否
transferable = true; //第三者への譲渡可否
restrictable = false; //制限設定の可否
revokable = true; //発行者からの還収可否

//モザイク定義
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, 
    nonce,
    sym.MosaicId.createFromNonce(nonce, alice.address), //モザイクID
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    0,//divisibility:可分性
    sym.UInt64.fromUint(0), //duration:有効期限
    networkType
);
//モザイク変更
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(list_amount),
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicDefTx.toAggregate(alice.publicAccount),
      mosaicChangeTx.toAggregate(alice.publicAccount),
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

一度モザイクを確認し、後方２つを確認
```js
getMosaicInfo(aliceAddress)
```

後方から２つ目を変更する
```js
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    new sym.MosaicId("3A8416DB2D53xxxx"), //目視確認
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint((star_amount -1)*list_amount),
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicChangeTx.toAggregate(alice.publicAccount),
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();

```

ルートネームスペースの入力
```js
rootNameSpace = "★ここにルートネームスペース"
```

ネームスペースの作成
```js
tx = sym.NamespaceRegistrationTransaction.createRootNamespace(
    sym.Deadline.create(epochAdjustment),
    rootNameSpace,
    sym.UInt64.fromUint(86400),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

gサブネームスペースの作成
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "g",  //作成するサブネームスペース
    rootNameSpace, //紐づけたいルートネームスペース
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

cサブネームスペースの作成
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "c",  //作成するサブネームスペース
    rootNameSpace, //紐づけたいルートネームスペース
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

pサブネームスペースの作成
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "p",  //作成するサブネームスペース
    rootNameSpace, //紐づけたいルートネームスペース
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

starサブネームスペースの作成
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "star",  //作成するサブネームスペース
    rootNameSpace, //紐づけたいルートネームスペース
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

ticketサブネームスペースの作成
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "ticket",  //作成するサブネームスペース
    rootNameSpace, //紐づけたいルートネームスペース
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

ネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(rootNameSpace);
address = sym.Address.createFromRawAddress(alice.address.plain());
tx = sym.AliasTransaction.createForAddress(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    address,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

モザイク確認しておく
```js
getMosaicInfo(alice.address)
```

gサブネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(`${rootNameSpace}.g`);
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx"); //目視確認
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

cサブネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(`${rootNameSpace}.c`);
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx"); //目視確認
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

pサブネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(`${rootNameSpace}.p`);
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx"); //目視確認
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

starサブネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(`${rootNameSpace}.star`);
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx"); //目視確認
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

ticketサブネームスペースのリンク
```js
namespaceId = new sym.NamespaceId(`${rootNameSpace}.ticket`);
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx"); //目視確認
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

# ヘルパー関数
アカウントアドレスとメタバース名のMAPを登録しておく
```js
accountMap = {
  "accountAddress1":"name1",
  "accountAddress2":"name2",
  "accountAddress3":"name3",
  "accountAddress4":"name4",  
}
```

showAllCard
```js
nsRepo = repo.createNamespaceRepository();
showAllCard = async function(addressList) { // モザイク情報を参照する関数を作成
  for (const address of addressList){
    accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(address)).toPromise();
    mosaicText = ""
    for (const mosaic of accountInfo.mosaics){
      let mosaicName = mosaic.id.toHex()
      mosaicNames = await nsRepo.getMosaicsNames(
      [new sym.MosaicId(mosaic.id.toHex())]
      ).toPromise();
      if(mosaicNames[0].names.length > 0){
       mosaicName = mosaicNames[0].names[0].name;
       if(mosaicName.slice(-1) == "g") mosaicName = "✊"
       if(mosaicName.slice(-1) == "c") mosaicName = "✌️"
       if(mosaicName.slice(-1) == "p") mosaicName = "✋"
       if(mosaicName.slice(-1) == "r") mosaicName = "🌟"
      }
      mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
      mosaicAmount = mosaic.amount.toString();
      divisibility = mosaicInfo.divisibility; //可分性
      if (divisibility > 0) {
        if(mosaicAmount / 10**divisibility >= 1 ){
        displayAmount =
          mosaicAmount.slice(0, mosaicAmount.length - divisibility) +  "." + mosaicAmount.slice(-divisibility);
        } else{
        displayAmount =
          "0." + "0".repeat(divisibility-mosaicAmount.slice(-divisibility).length) + mosaicAmount.slice(-divisibility);
        }
      } else {
        displayAmount = mosaicAmount;
      }
      mosaicText = `${mosaicText} ${mosaicName}(${displayAmount})`
    };
    console.log(`${accountInfo.address.address} ${accountInfo.publicKey} ${mosaicText}`);
  };
};
```
statisticsHand
```js
statisticsHand = async function() { // モザイク情報を参照する関数を作成
  for (const address of [alice.address.plain()]){
    accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(address)).toPromise();
    mosaicText = ""
    for (const mosaic of accountInfo.mosaics){
      let mosaicName = mosaic.id.toHex()
      mosaicNames = await nsRepo.getMosaicsNames(
      [new sym.MosaicId(mosaic.id.toHex())]
      ).toPromise();
      if(mosaicNames[0].names.length > 0){
       mosaicName = mosaicNames[0].names[0].name;
       if(mosaicName.slice(-1) == "g") mosaicName = "✊"
       if(mosaicName.slice(-1) == "c") mosaicName = "✌️"
       if(mosaicName.slice(-1) == "p") mosaicName = "✋"
      }
      mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
      mosaicAmount = list_amount - Number(mosaic.amount.toString());

      mosaicText = `${mosaicText} ${mosaicName}(${mosaicAmount})`
    };
    console.log(`${mosaicText}`);
    console.log(`ジャンケンの手札がない部分の数値は${list_amount}`);
  };
};

```
judgeHand
```js
judgeHand = async function(aHand,aAddress,bHand,bAddress,alice,rootNameSpace) {
  //モザイクの所有確認(目視)
  showAllCard([aAddress,bAddress])
  console.log([aAddress,bAddress])
  starNamespaceId = new sym.NamespaceId(`${rootNameSpace}.star`);

  //A手札回収トランザクション
  revAhandNamespaceId = new sym.NamespaceId(`${rootNameSpace}.${aHand}`);
  revAhandTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(aAddress),
    new sym.Mosaic(revAhandNamespaceId, sym.UInt64.fromUint(1)),
    networkType
  );

  //B手札回収トランザクション
  revBhandNamespaceId = new sym.NamespaceId(`${rootNameSpace}.${bHand}`);
  revBhandTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(bAddress),
    new sym.Mosaic(revBhandNamespaceId, sym.UInt64.fromUint(1)),
    networkType
  );

  //Aスター回収トランザクション
  revAstarTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(aAddress),
    new sym.Mosaic(starNamespaceId, sym.UInt64.fromUint(1)),
    networkType
  );

  //Bスター回収トランザクション
  revBstarTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(bAddress),
    new sym.Mosaic(starNamespaceId, sym.UInt64.fromUint(1)),
    networkType
  );

  //Aスター送付トランザクション
  sendAstarTx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(aAddress),
    [new sym.Mosaic(starNamespaceId,sym.UInt64.fromUint(1))],
    sym.EmptyMessage, //メッセージ無し
    networkType
  );

  //Bスター送付トランザクション
  sendBstarTx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(bAddress),
    [new sym.Mosaic(starNamespaceId,sym.UInt64.fromUint(1))],
    sym.EmptyMessage, //メッセージ無し
    networkType
  );

  aggregateArray = []

  if(aHand == "g" && bHand == "c"){  //Aの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "c" && bHand == "p"){  //Aの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "p" && bHand == "g"){  //Aの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "c" && bHand == "g"){  //Bの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "p" && bHand == "c"){  //Bの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "g" && bHand == "p"){  //Bの勝ちパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else{  //あいこパターン
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
    ]
  }
  aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    aggregateArray,
    networkType,[],
  ).setMaxFeeForAggregate(100, 0); //最低手数料はノードの最低手数料設定の分布を見て中央値付近の30に変更

  ///管理者アカウントオブジェクトで署名を行う
  signedTx = alice.sign(aggregateTx,generationHash);

  //トランザクションをアナウンスする
  txRepo.announce(signedTx).toPromise();
  const transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash
  console.log(transactionStatusUrl);

}

```
makeAccounts
```js
makeAccounts = async function(list_amount) {
  newAccountList = []
  for (let i = 0; i < list_amount; i++) {
    bob = sym.Account.generateNewAccount(networkType);
    bobPublicAccount = sym.PublicAccount.createFromPublicKey(
      bob.publicKey,
      networkType
    );
    bobAddress = sym.Address.createFromRawAddress(
      bob.address.plain()
    );
    tx = sym.TransferTransaction.create(
      sym.Deadline.create(epochAdjustment),
      bobAddress,
      [new sym.Mosaic(
        new sym.NamespaceId(`symbol.xym`),
        sym.UInt64.fromUint(10000000)
      )],
      sym.PlainMessage.create('new account for janken test'),
      networkType
    ).setMaxFee(100);

    signedTx = alice.sign(tx,generationHash);
    res = await txRepo.announce(signedTx).toPromise();
    newAccountList.push(bob.address.plain())
  }
  console.log(newAccountList)
}
```
shuffleCard
```js
shuffleCard = async function(accountList,star_amount) {
  gList = [...Array(accountList.length)].map((i) => `${rootNameSpace}.g`)
  cList = [...Array(accountList.length)].map((i) => `${rootNameSpace}.c`)
  pList = [...Array(accountList.length)].map((i) => `${rootNameSpace}.p`)
  handList = [...gList,...cList,...pList]
  const shuffle = ([...array]) => {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  handList = shuffle(handList)
  const sliceByNumber = (array, number) => {
    const length = Math.ceil(array.length / number);
    return new Array(length)
      .fill()
      .map((_, i) => array.slice(i * number, (i + 1) * number));
  };
  handList = sliceByNumber(handList,3)
  for (let i = 0; i < accountList.length; i++) {
    Array.prototype.countCertainElements = function(value){
      return this.filter(arrayElement => arrayElement == value).length
    }
    txList = [new sym.Mosaic(
      new sym.NamespaceId(`${rootNameSpace}.star`),
      sym.UInt64.fromUint(star_amount)
    )]

    if(handList[i].countCertainElements(`${rootNameSpace}.g`) > 0 ){
      txList.push(
        new sym.Mosaic(
          new sym.NamespaceId(`${rootNameSpace}.g`),
          sym.UInt64.fromUint(handList[i].countCertainElements(`${rootNameSpace}.g`))
        ),
      )
    }

    if(handList[i].countCertainElements(`${rootNameSpace}.c`) > 0 ){
      txList.push(
        new sym.Mosaic(
          new sym.NamespaceId(`${rootNameSpace}.c`),
          sym.UInt64.fromUint(handList[i].countCertainElements(`${rootNameSpace}.c`))
        ),
      )
    }

    if(handList[i].countCertainElements(`${rootNameSpace}.p`) > 0 ){
      txList.push(
        new sym.Mosaic(
          new sym.NamespaceId(`${rootNameSpace}.p`),
          sym.UInt64.fromUint(handList[i].countCertainElements(`${rootNameSpace}.p`))
        ),
      )
    }

    tx = sym.TransferTransaction.create(
      sym.Deadline.create(epochAdjustment),
      sym.Address.createFromRawAddress(accountList[i]),
      txList,
      sym.PlainMessage.create('限定ジャンケン参加に必要な★と3枚カード'),
      networkType
    ).setMaxFee(100);

    signedTx = alice.sign(tx,generationHash);
    res = await txRepo.announce(signedTx).toPromise();
    const transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash
    console.log(transactionStatusUrl);

  }
}
```
