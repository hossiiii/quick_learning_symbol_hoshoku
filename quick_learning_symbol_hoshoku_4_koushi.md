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

# アカウント情報確認
### 4.Aliceアカウント情報をSymbolエクスプローラーで表示する
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックしてアカウント情報を別タブで表示しておく
```

### 5.署名したアドレスに対して修了証を送る * 署名要求の数分
```js
target = "署名要求のアドレス" //受講者のアドレス
"署名要求のアドレス" = "メタバース名" //後で使うためにここで登録しておく
targetAddress = sym.Address.createFromRawAddress(target)
accountInfo = await accountRepo.getAccountInfo(targetAddress).toPromise();
targetPublicAccount = sym.PublicAccount.createFromPublicKey(
  accountInfo.publicKey,
  networkType
);
tx1 = sym.TransferTransaction.create(
    undefined,
    targetAddress,  //ターゲットへ
    [ //1XYM
      new sym.Mosaic(
        new sym.NamespaceId("mit.certificate.quick_learning_symbol_lesson4"), //４回目の修了書
        sym.UInt64.fromUint(1) //数量
      )
    ],
    sym.PlainMessage.create('４回目の受講お疲れ様でした'), //メッセージ
    networkType
);

tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  //自分へ
    [
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"), //XYM
        sym.UInt64.fromUint(1) //数量
      )
    ],
    sym.PlainMessage.create('４回目の修了書を下さい'), //メッセージ
    networkType
);

aggregateArray = [
    tx1.toAggregate(alice.publicAccount), //自分からtx1を送る
    tx2.toAggregate(targetPublicAccount), // ターゲットからtx2を送る
]

//アグリゲートボンデッドトランザクション
aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
    aggregateArray,
    networkType,
    [],
).setMaxFeeForAggregate(100, 1);

//署名
signedAggregateTx = alice.sign(aggregateTx, generationHash);

```

```js
//ハッシュロックTX作成
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
    new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //10xym固定値
    sym.UInt64.fromUint(480), // ロック有効期限
    signedAggregateTx,// このハッシュ値を登録
    networkType
).setMaxFee(100);

//署名
signedLockTx = alice.sign(hashLockTx, generationHash);

//ハッシュロックTXをアナウンス
await txRepo.announce(signedLockTx).toPromise();
```
以下コマンドでエラーが発生しなければ成功しています。もしくはエクスプローラーのトランザクション履歴でも確認ができます。

```js
await txRepo.getTransaction(signedLockTx.hash,sym.TransactionGroup.Confirmed).toPromise();
```

ハッシュロックTXがブロックチェーン上で認識される前にアグリゲートトランザクションをアナウンスしてしまうとそのハッシュはGOXします。

```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

# 参加者人数の確定とチャットでお知らせ
リスト用の関数を作成しチャットで通知する
```js
allAccountList = ['a', 'b', 'c','d']
```

# モザイク数の変更
最終人数の確定後、追加分の値を入力し数の変更を行う
```js
rootNameSpace = "mit"
list_amount = 参加人数
star_amount = 3
```

gの数を変更する
```js
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    new sym.MosaicId("01A2933F867CF358"), //目視確認
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(list_amount -1),
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

cの数を変更する
```js
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    new sym.MosaicId("3D7B7B217981A360"), //目視確認
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(list_amount -1),
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

pの数を変更する
```js
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    new sym.MosaicId("5B82332919883CE0"), //目視確認
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(list_amount -1),
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

スターの数を変更する
```js
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    new sym.MosaicId("7DEB4DCBBF8E5090"), //目視確認
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(star_amount * list_amount -1), //多くなるように
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

# ヘルパー関数

showAllCard
```js
nsRepo = repo.createNamespaceRepository();
showAllCard = async function() { // モザイク情報を参照する関数を作成
  for (const address of allAccountList){
    accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(address)).toPromise();
    mosaicText = ""
    for (const mosaic of accountInfo.mosaics){
      let mosaicName = mosaic.id.toHex()
      mosaicNames = await nsRepo.getMosaicsNames(
      [new sym.MosaicId(mosaic.id.toHex())]
      ).toPromise();
      if(mosaicNames[0].names.length > 0){
       mosaicName = mosaicNames[0].names[0].name;
       if(mosaicName.slice(-1) == "g") mosaicName = "✊ " + mosaicName
       if(mosaicName.slice(-1) == "c") mosaicName = "✌️ " + mosaicName
       if(mosaicName.slice(-1) == "p") mosaicName = "✋ " + mosaicName
       if(mosaicName.slice(-1) == "r") mosaicName = "🌟 " + mosaicName
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
    accountText = address
    try{
      accountText = address + "(" + eval(accountText) + ")";
    }catch(e){
    }
    console.log(`${accountText} ${accountInfo.publicKey} ${mosaicText}`);
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
      mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
      mosaicAmount = list_amount - Number(mosaic.amount.toString());
      if(mosaicNames[0].names.length > 0){
       mosaicName = mosaicNames[0].names[0].name;
       if(mosaicName.slice(-1) == "g") {
        mosaicName = "✊"
        mosaicText = `${mosaicText} ${mosaicName}(${mosaicAmount})`
       }
       if(mosaicName.slice(-1) == "c") {
        mosaicName = "✌️"
        mosaicText = `${mosaicText} ${mosaicName}(${mosaicAmount})`
       }
       if(mosaicName.slice(-1) == "p") {
        mosaicName = "✋"
        mosaicText = `${mosaicText} ${mosaicName}(${mosaicAmount})`
       }
      }
    };
    console.log(`==============電光掲示板==============`);
    console.log(`${mosaicText}`);
    console.log(`ジャンケンの手札がない部分の数値は${list_amount}`);
    console.log(`=====================================`);
  };
};

```
judgeHand
```js
judgeHand = async function(aHand,aAddress,bHand,bAddress) {
  //モザイクの所有確認(目視)
  showAllCard([aAddress,bAddress])
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
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(aAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + aAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "c" && bHand == "p"){  //Aの勝ちパターン
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(aAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + aAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "p" && bHand == "g"){  //Aの勝ちパターン
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(aAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + aAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revBstarTx.toAggregate(alice.publicAccount),
      sendAstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "c" && bHand == "g"){  //Bの勝ちパターン
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(bAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + bAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "p" && bHand == "c"){  //Bの勝ちパターン
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(bAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + bAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else if(aHand == "g" && bHand == "p"){  //Bの勝ちパターン
    try{
      console.log("--------------------------------")
      console.log("勝者　" + eval(bAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("勝者　" + bAddress)
      console.log("--------------------------------")
    }
    aggregateArray = [
      revAhandTx.toAggregate(alice.publicAccount),
      revBhandTx.toAggregate(alice.publicAccount),
      revAstarTx.toAggregate(alice.publicAccount),
      sendBstarTx.toAggregate(alice.publicAccount),
    ]
  }else{  //あいこパターン
    try{
      console.log("--------------------------------")
      console.log("あいこ　" + eval(aAddress) + " = " + eval(bAddress))
      console.log("--------------------------------")
    }catch(e){
      console.log("--------------------------------")
      console.log("あいこ　" + aAddress + " = " + bAddress)
      console.log("--------------------------------")
    }
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
revokeStar
```js
revokeStar = async function(address) {
  //モザイクの所有確認(目視)
  showAllCard([address])
  starNamespaceId = new sym.NamespaceId(`${rootNameSpace}.star`);

  //Star手札回収トランザクション
  revStarTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(address),
    new sym.Mosaic(starNamespaceId, sym.UInt64.fromUint(1)),
    networkType
  );

  aggregateArray = []
  try{
    console.log("--------------------------------")
    console.log("星を回収します　" + eval(address))
    console.log("--------------------------------")
  }catch(e){
    console.log("--------------------------------")
    console.log("星を回収します　" + address)
    console.log("--------------------------------")
  }
  aggregateArray = [
    revStarTx.toAggregate(alice.publicAccount),
  ]

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
    console.log(bob.privateKey);
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
shuffleCard = async function(accountList) {
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
sendCard
```js
sendCard = async function(accountList,subNameSpace,message,alice) {
  aggregateArray = []
  for (let i = 0; i < accountList.length; i++) {
    innerTx = sym.TransferTransaction.create(
      sym.Deadline.create(epochAdjustment),
      sym.Address.createFromRawAddress(accountList[i]),
      [
        new sym.Mosaic(
          new sym.NamespaceId(`${rootNameSpace}.${subNameSpace}`),
          sym.UInt64.fromUint(1)
        ),
      ],
      sym.PlainMessage.create(message),
      networkType
    );
    aggregateArray.push(
      innerTx.toAggregate(alice.publicAccount),
    )
  }

  ///アグリゲートトランザクションを作成する
  aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    aggregateArray,
    networkType,[],
  ).setMaxFeeForAggregate(100, 0);

  ///管理者アカウントオブジェクトで署名を行う
  signedTx = alice.sign(aggregateTx,generationHash);

  //トランザクションをアナウンスする
  txRepo.announce(signedTx).subscribe(x=>console.log(x));
  transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash
  console.log(transactionStatusUrl);
}

```
