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
### 3-b.もし間違って途中でリロードしてしまった場合は項目1、項目2の後に保管しておいた秘密鍵を”YourPrivateKey”と置き換えて実行して下さい
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
### 4.Aliceアカウントへ30XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=30&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```
### 5.メタバースのチャットにAliceのアドレスを貼り付ける
```js
//以下のアドレスを貼り付けて下さい
aliceAddress.plain()
```
# 速習Symbol9章マルチシグ化

### 6.以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/09_multisig.md

### 7. 9.3 マルチシグ署名 アグリゲートボンデッドトランザクションで送信 の補足
実際にアグリゲートボンデッドトランザクションで送信された要求に対して署名を行う手順を記載します。

①Symbolエクスプローラーで自分のアカウント情報を開きます。
```js
`https://testnet.symbol.fyi/accounts/${carol2.plain()}` //carol2に対する要求を確認する場合
```

②未署名のトランザクションの確認

TRANSACTIONS（トランザクション）セクションのフィルターをRecentからPatialに変更し未署名のトランザクションを確認する

<img width="1352" alt="スクリーンショット 2023-02-01 18 12 57" src="https://user-images.githubusercontent.com/47712051/216004350-9b84491b-da8d-4d77-a6f7-cbf0fd08a31c.png">

③未署名のトランザクションの内容を確認

Hash(トランザクションハッシュ)のリンクをクリックし矢印内部のアイコンにカーソルを合わせるとトランザクションの内容がポップアップされます。

自分が署名したい内容であれば、Hash(トランザクションハッシュ)のテキスト部分をコピーしておきます。


<img width="1333" alt="スクリーンショット 2023-02-01 18 27 47" src="https://user-images.githubusercontent.com/47712051/216004369-0916ee55-c2d6-4910-a133-936476055400.png">

④TargetHashの部分に先ほどのHash(トランザクションハッシュ)を貼り付け、連署を行いアナウンスを行います。

```js
txInfo = await txRepo.getTransaction("TargetHash",sym.TransactionGroup.Partial).toPromise(); //ハッシュ値でトランザクションを検索
cosignatureTx = sym.CosignatureTransaction.create(txInfo); //連署用のトランザクションを作成
signedCosTx = carol2.signCosignatureTransaction(cosignatureTx); //carol2に対する要求に連署する場合
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise(); //ブロックチェーンにアナウンス
```

⑤　③と同じページをリロードし、一番した部分にあるAGGREGATE COSIGNATURES(アグリゲート連署名)を確認し、自分のアドレスが入っていれば連署が成功となります。

<img width="1359" alt="スクリーンショット 2023-02-01 18 41 50" src="https://user-images.githubusercontent.com/47712051/216007548-3a799f70-2adc-4cbd-b372-ad631aa56311.png">

⑥　carl3についても同じように①〜⑤を実行し連署を行うことで起案者のcarol1,とcarol2,carol3の連署が完成しマルチシグからのトランザクションが実行される

# 演習準備

### 7.人狼ゲーム用マルチシグ参加への連署（連署方法の確認）
マルチシグアカウントへの参加を行います。

また人狼ゲームが始まった後も追放者への連署で同じ方法を使って連署を行いますのでこの流れは覚えておいて下さい。



# 操作確認
### 8.参加メンバーのアドレスリストをコピーして貼り付けておく
名前からアドレスを呼び出せるように定義しておく
```js
たろう = "TA2JD6AB3XOCOKW3OMP3KJY3OPHCD3IJDL4B7TA"
じろう = "TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI"
・・・
```

### 9.追放者

# オンチェーンアンケート
今日の勉強をオンチェーンアンケートに回答します。

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TCHVQXALVLUAODWFFKDLHAA2T25B4EQP4MRIF4Q"),
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
`https://testnet.symbol.fyi/accounts/TCHVQXALVLUAODWFFKDLHAA2T25B4EQP4MRIF4Q` //以下リンクをクリック
```
