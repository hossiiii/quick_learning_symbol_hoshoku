# 準備
以下リンクを別ウィンドウで開き、F12からコンソールを表示させる

https://sym-test-04.opening-line.jp:3001/node/health




表示用のウィンドウとF12コンソール実行用のウィンドウを左右に並べておく


<img width="1512" alt="gazou" src="https://user-images.githubusercontent.com/47712051/222124362-a75071f6-f77c-45e9-b23f-5abac357eb13.png">



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
```

### 3.新規Carolアカウントの作成とXYM補充
```js
carol = sym.Account.generateNewAccount(networkType);
`https://testnet.symbol.tools/?amount=100&recipient=${carol.address.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

### 4.新規bobアカウントの作成とXYM補充
```js
bob = sym.Account.generateNewAccount(networkType);
`https://testnet.symbol.tools/?amount=100&recipient=${bob.address.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

### 5.新規daveアカウントの作成とXYM補充
```js
dave = sym.Account.generateNewAccount(networkType);
`https://testnet.symbol.tools/?amount=100&recipient=${dave.address.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

### 6.SymbolエクスプローラーでCarolのアカウント情報を開いておく
このエクスプローラーは何度も参照するので、左側の参照用ウィンドウに移動させておきます
```js
`https://testnet.symbol.fyi/accounts/${carol.address.plain()}` //以下リンクをクリック
```


# 速習Symbol11.制限
![image](https://user-images.githubusercontent.com/47712051/229624965-eaf6ae6e-7a61-4cf4-9ca9-1bdfad5cafbf.png)
![image](https://user-images.githubusercontent.com/47712051/229624979-b306ee0b-c83e-4b86-8376-91f031af7856.png)
![image](https://user-images.githubusercontent.com/47712051/229624993-7527cdd1-7919-44b9-9c6f-1f5b3e4d1310.png)
![image](https://user-images.githubusercontent.com/47712051/229625002-455e6099-9b95-431d-8686-d09f91b9a16d.png)
![image](https://user-images.githubusercontent.com/47712051/229625011-449e35b6-8510-49c6-9f45-e07bce0295dd.png)
![image](https://user-images.githubusercontent.com/47712051/229625022-c67dc00f-d002-4120-8a14-fe885a95f670.png)
![image](https://user-images.githubusercontent.com/47712051/229625035-d3408a69-bb9a-40cc-b405-70fdf68ccbd2.png)
![image](https://user-images.githubusercontent.com/47712051/229625053-4a91f670-e1e1-4d20-a32f-cabb082c5915.png)
![image](https://user-images.githubusercontent.com/47712051/229625065-d561e4cd-aaf2-4701-a10e-cd4f7c063cb0.png)
![image](https://user-images.githubusercontent.com/47712051/229625087-5411527e-004d-45d6-ba0f-52ccb3c650f7.png)



### 以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/11_restriction.md

## 11.1 アカウント制限　補足

## 指定アドレスからの受信制限・指定アドレスへの送信制限　補足

### 11.1.1.1 carolからbobにトランスファーTxを送ってみる
```js
trTx = sym.TransferTransaction.create(
        sym.Deadline.create(epochAdjustment),
        bob.address, 
        [new sym.Mosaic(new sym.MosaicId("72C0212E67A08BCE"), sym.UInt64.fromUint(1))],
        sym.PlainMessage.create(""),
        networkType
      ).setMaxFee(100);
signedTx = carol.sign(trTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

```js
transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash //アナウンスしたTxがブロックチェーン上でどの状態か確認するため
console.log(transactionStatusUrl);
```

### 11.1.1.2 carolからdaveにトランスファーTxを送ってみる
```js
trTx = sym.TransferTransaction.create(
        sym.Deadline.create(epochAdjustment),
        dave.address, 
        [new sym.Mosaic(new sym.MosaicId("72C0212E67A08BCE"), sym.UInt64.fromUint(1))],
        sym.PlainMessage.create(""),
        networkType
      ).setMaxFee(100);
signedTx = carol.sign(trTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

```js
transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash //アナウンスしたTxがブロックチェーン上でどの状態か確認するため
console.log(transactionStatusUrl);
```

### 11.1.1.3 bobからcarolにトランスファーTxを送ってみる
```js
trTx = sym.TransferTransaction.create(
        sym.Deadline.create(epochAdjustment),
        carol.address, 
        [new sym.Mosaic(new sym.MosaicId("72C0212E67A08BCE"), sym.UInt64.fromUint(1))],
        sym.PlainMessage.create(""),
        networkType
      ).setMaxFee(100);
signedTx = bob.sign(trTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

```js
transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash //アナウンスしたTxがブロックチェーン上でどの状態か確認するため
console.log(transactionStatusUrl);
```

### 11.1.1.4 daveからcarolにトランスファーTxを送ってみる
```js
trTx = sym.TransferTransaction.create(
        sym.Deadline.create(epochAdjustment),
        carol.address, 
        [new sym.Mosaic(new sym.MosaicId("72C0212E67A08BCE"), sym.UInt64.fromUint(1))],
        sym.PlainMessage.create(""),
        networkType
      ).setMaxFee(100);
signedTx = dave.sign(trTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

```js
transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash //アナウンスしたTxがブロックチェーン上でどの状態か確認するため
console.log(transactionStatusUrl);
```

### 11.1.3.1 carolからbobにアグリゲートTxを送ってみる
```js
trTx = sym.TransferTransaction.create(
        sym.Deadline.create(epochAdjustment),
        bob.address, 
        [new sym.Mosaic(new sym.MosaicId("72C0212E67A08BCE"), sym.UInt64.fromUint(1))],
        sym.PlainMessage.create(""),
        networkType
      );
aggregateArray = [
  trTx.toAggregate(carol.publicAccount),
]
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  aggregateArray,
  networkType,[]
).setMaxFeeForAggregate(100, 1);
signedTx = carol.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

```js
transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash //アナウンスしたTxがブロックチェーン上でどの状態か確認するため
console.log(transactionStatusUrl);
```

### 11.1.3.2 Carolアカウント作り直し

```js
carol = sym.Account.generateNewAccount(networkType);
`https://testnet.symbol.tools/?amount=100&recipient=${carol.address.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

```js
`https://testnet.symbol.fyi/accounts/${carol.address.plain()}` //以下リンクをクリック
```


# オンチェーンアンケート
今日の勉強をオンチェーンアンケートに回答します。

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目/5回目/６回目/7回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TBDGKVKGFITSZEXI676WNPRL7JDKFDJ5D4JG4TQ"),
    [],
    sym.PlainMessage.create(`
    ①
    ②
    ③
    ④
    ⑤  
    `), //全角で300字まで入力できます。
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

### こちらからみなさんの回答を誰もがオンチェーンで見る事ができます。

```js
`https://testnet.symbol.fyi/accounts/TBDGKVKGFITSZEXI676WNPRL7JDKFDJ5D4JG4TQ`
```
