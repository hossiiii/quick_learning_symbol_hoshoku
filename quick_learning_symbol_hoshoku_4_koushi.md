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
# モザイク作成とネームスペース割り当て

参加者数とモザイク数(暗号メッセージが全て届いてから数をカウントする)
```js
list_amount = 4
card_amount = 3
star_amount = 3
```

手札モザイクの作成*3
```js
supplyMutable = false; //供給量変更の可否
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
    sym.UInt64.fromUint(list_amount*card_amount), //数量は手札モザイクは3＊人数、星は＊＊＊と人数
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

スターモザイクの作成*3
```js
supplyMutable = false; //供給量変更の可否
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
    sym.UInt64.fromUint(list_amount*star_amount), //数量は手札モザイクは3＊人数、星は＊＊＊と人数
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

# ヘルパー関数
accountList
```js
nsRepo = repo.createNamespaceRepository();
accountList = async function(addressList) { // モザイク情報を参照する関数を作成
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

judgeHand
```js
judgeHand = async function(aHand,aAddress,bHand,bAddress,alice,rootNameSpace) {
  //モザイクの所有確認(目視)
  accountList([aAddress,bAddress])

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
}
```
