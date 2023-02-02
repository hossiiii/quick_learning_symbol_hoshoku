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
nsRepo = repo.createNamespaceRepository();
receiptRepo = repo.createReceiptRepository();
transactionService = new sym.TransactionService(txRepo, receiptRepo);
wsEndpoint = NODE.replace('http', 'ws') + "/ws";
listener = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
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
//間違ってコンソールをリロードしてしまうと、アカウントが消えてしまいます。
//そのため秘密鍵を出力し、別途テキストなどに貼り付けておきます。
console.log("privateKey " + alice.privateKey);
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

### 4.Aliceアカウントへ20XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=20&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```

### 5.Aliceアカウント情報をSymbolエクスプローラーで表示する
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックしてアカウント情報を別タブで表示しておく
```

### 6.自分のメタバースの名前をメッセージで送る
AliceアカウントからMIT（みやこでIT）のアドレスへ自分のメタバースの名前を送る。

```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A"),
    [],
    sym.PlainMessage.create("ここにメタバース上の名前に書き換えて"), //【🌟要変更箇所🌟】
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

# 演習準備
### 7.参加メンバーのアドレスリストをコピーしてコンソールに貼り付けておく
```js
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress("TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A")).toPromise();
await txRepo.search({
  group: sym.TransactionGroup.Confirmed,
  recipientAddress:accountInfo.address,
  order:sym.Order.Desc,
  pageSize:30
}).toPromise().then(page=>{
  if (page.pageSize > 0) {
    page.data.forEach((tx) => {
      if(tx.message.type == 0){
        msg = tx.message.payload
        console.log(`${msg} = "${tx.signer.address.address}"`)
        console.log(`${tx.signer.address.address} = "${msg}"`)
      }
    });
  }
});
```

### 8.参加者用のｇｉｔｈｕｂで参加者リストを更新する
[アドレスリストへ行きgitを更新する](https://github.com/hossiiii/quick_learning_symbol_hoshoku/blob/main/quick_learning_symbol_addressList_5.md)

### 9.参加メンバーにマルチシグ参加要求を行う
```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined,
    x, //🌟修正🌟参加人数の人数の半分を指定する
    x, //🌟修正🌟参加人数の人数の半分を指定する
    [
        sym.Address.createFromRawAddress(bob1),
        sym.Address.createFromRawAddress(bob2),
        sym.Address.createFromRawAddress(bob3),
        sym.Address.createFromRawAddress(bob4),
        sym.Address.createFromRawAddress(bob5),
    ], //🌟修正🌟参加人数のリスト分（hossiiii以外）
    [],//除名対象アドレスリスト
    networkType
);

aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
    [
      multisigTx.toAggregate(alice.publicAccount),
    ],
    networkType,[]
).setMaxFeeForAggregate(100, 0);

signedAggregateTx = alice.sign(aggregateTx, generationHash);

hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
	new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //固定値:10XYM
	sym.UInt64.fromUint(480),
	signedAggregateTx,
	networkType
).setMaxFee(100);

signedLockTx = alice.sign(hashLockTx, generationHash);


listener.open().then(() => {
    transactionService
      .announceHashLockAggregateBonded(
        signedLockTx,
        signedAggregateTx,
        listener
      )
      .subscribe({
        next: (x) => {
          console.log(x);
        },
        error: (err) => {
          console.error(err);
          listener.close();
        },
        complete: () => {
          listener.close();
        },
    });
});
```

### 10.ディスプレイ表示用コマンド
```js
id = setInterval(async() => {
  console.log("==================🔥受付中の追放投票🔥=================")
  result = await txRepo.search(
    {
      group:sym.TransactionGroup.Partial,
      embedded:true,
      address:alice.address
    }
  ).toPromise();
  
  msigRepo = repo.createMultisigRepository();
  multisigInfo = await msigRepo.getMultisigAccountInfo(alice.address).toPromise();
  cahinRepo = repo.createChainRepository()
  cahinInfo = await cahinRepo.getChainInfo().toPromise();
  
  txes = result.data;
  
  for (let index = 0; index < txes.length; index++) {
    try{
      hlRepo = repo.createHashLockRepository();
      lockInfo = await hlRepo.search({group:sym.TransactionGroup.Confirmed,address:sym.Address.createFromRawAddress(txes[index].signer.address.address)}).toPromise();
      if(lockInfo.data.length > 0){ //署名が集まったら表示されなくなる
        txInfo = await txRepo.getTransaction(txes[index].transactionInfo.hash,sym.TransactionGroup.Partial).toPromise();
        text = `投票内容： ${eval(txes[index].signer.address.address)}　=>　${eval(txInfo.innerTransactions[0].addressDeletions[0].address)}
連署者(${txInfo.cosignatures.length}/${multisigInfo.minRemoval-1})： `
          if(txInfo.cosignatures.length>0){
              for (let index = 0; index < txInfo.cosignatures.length; index++) {
              text = `${text} ${eval(txInfo.cosignatures[index].signer.address.address)},`
              }
          }
          text = `${text}
起案者からのメッセージ： ${txInfo.innerTransactions[1].message.payload}
hash値： ${txes[index].transactionInfo.hash}`
          if(lockInfo.data[0].endHeight.compact() - cahinInfo.height.compact() > 0){ //有効
            text = `${text}
有効期限： 残り${(lockInfo.data[0].endHeight.compact() - cahinInfo.height.compact())*30}秒`
          }else{
            text = `${text}
有効期限： 期限切れ❌このhash値に連署しても除名は実行されませんが署名は可能です`
          }
          console.log(text)
      }
    }catch{
    }
  }

  setTimeout(async() => {
    result = await txRepo.search(
      {
        group:sym.TransactionGroup.Confirmed,
        embedded:true,
        address:alice.address
      }
    ).toPromise();
  
    txes = result.data;
    for (let index = 0; index < txes.length; index++) {
        try{
          if(txes[index].type == 16961){
            txInfo = await txRepo.getTransaction(txes[index].transactionInfo.hash,sym.TransactionGroup.Confirmed).toPromise();
            text = `⏹終了した投票⏹ ${eval(txes[index].signer.address.address)},`
              if(txInfo.cosignatures.length>0){
                  for (let index = 0; index < txInfo.cosignatures.length; index++) {
                  text = `${text} ${eval(txInfo.cosignatures[index].signer.address.address)},`
                  }
              }
              text = `${text} => ${eval(txInfo.innerTransactions[0].addressDeletions[0].address)}`
              console.log(text)
          }
        }catch{
        }
    }
  }, 100);
  
  setTimeout(async() => {
    msigRepo = repo.createMultisigRepository();
    multisigInfo = await msigRepo.getMultisigAccountInfo(alice.address).toPromise();
  
    txes = multisigInfo.cosignatoryAddresses;
    text = "😇生存者リスト😇"
    for (let index = 0; index < txes.length; index++) {
      text = `${text} ${eval(txes[index].plain())},`
    }
    console.log(text)
  
    result = await txRepo.search(
      {
        group:sym.TransactionGroup.Confirmed,
        embedded:true,
        address:alice.address
      }
    ).toPromise();
  
    txes = result.data;
    text = "💀追放者リスト💀"
    for (let index = 0; index < txes.length; index++) {
        if(txes[index].type == 16961){
            txInfo = await txRepo.getTransaction(txes[index].transactionInfo.hash,sym.TransactionGroup.Confirmed).toPromise();
            if(txInfo.innerTransactions[0].addressDeletions.length > 0)
            text = `${text} ${eval(txInfo.innerTransactions[0].addressDeletions[0].address)},`
        }
    }
    console.log(text)
    console.log("================================================")
    console.log("")
  }, 500);

}, 10000);
```
### 11.定期実行の停止
```js
clearInterval(id)
```

### 12.追放された人への暗号メッセージ
・別タブでMITのアカウントでログインをしておく。

・さらに参加者アドレスリストも貼り付けておく

```js
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(tuihousaretahitononamae)).toPromise();
encMsg = alice.encryptMessage("ここに人狼の名前",accountInfo.publicAccount);
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment), //Deadline:有効期限
  accountInfo.address,
  [],
  encMsg, //メッセージ
  networkType //テストネット・メインネット区分
).setMaxFee(100); //手数料
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```
