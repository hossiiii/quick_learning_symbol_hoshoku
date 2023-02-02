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

### 6.メタバースのチャットにAliceのアドレスを貼り付ける
```js
//以下のアドレスを貼り付けて下さい
aliceAddress.plain()
```

# 演習準備
### 7.参加メンバーのアドレスリストをコピーしてコンソールに貼り付けておく
Discordからデータをコピーして、コンソールに貼り付ける

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
