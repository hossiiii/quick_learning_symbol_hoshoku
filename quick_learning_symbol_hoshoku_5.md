# 準備
メタバース上の名前をローマ字で設定しておく

　　※前回の講義で@アドレス表記になっている方は＠を含むアドレスを削除してローマ字に変更して下さい



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
### 4.Aliceアカウントへ20XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=20&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
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
`https://testnet.symbol.fyi/accounts/${carol2.address.plain()}` //carol2に対する要求を確認する場合、carol3の場合はここを変更して下さい
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
signedCosTx = carol2.signCosignatureTransaction(cosignatureTx); //carol2に対する要求に連署する場合、carol3の場合はここを変更して下さい
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise(); //ブロックチェーンにアナウンス
```

⑤　③と同じページをリロードし、一番した部分にあるAGGREGATE COSIGNATURES(アグリゲート連署名)を確認し、自分のアドレスが入っていれば連署が成功となります。

<img width="1359" alt="スクリーンショット 2023-02-01 18 41 50" src="https://user-images.githubusercontent.com/47712051/216007548-3a799f70-2adc-4cbd-b372-ad631aa56311.png">

⑥　carl3についても同じように①〜⑤を実行し連署を行うことで起案者のcarol1,とcarol2,carol3の連署が完成しマルチシグからのトランザクションが実行される

# 演習の前に
### 8.人狼ゲーム参加表明
演習ではマルチシグアカウントをを作成するために参加者全員の署名をオンチェーン上で集める必要があります。

そのためには必ず項番7で行ったアグリゲートボンデッドトランザクションで送信された要求に対して署名が出来る事が必須条件となります。

この条件を満たせている人は参加表明としてメタバース上で⭕️⭕️番の絵の前に立って下さい。

条件を満たせていない人は大変申し訳ありませんが、人狼ゲームに参加せず速習Symbol９章の再学習を行なって下さい。

※一緒にゲーム会場に移動頂くことは問題ありません。

# 演習準備

### 9.人狼ゲーム用マルチシグ参加への連署
aliceアカウントで人狼ゲーム用のマルチシグアカウントへの参加を行います。

※項番7で行ったアグリゲートボンデッドトランザクションで送信された要求に対して署名を行うと同じ方法です。

①Symbolエクスプローラーで自分のアカウント情報を開きます。
```js
`https://testnet.symbol.fyi/accounts/${alice.address.plain()}` //aliceに対する要求を確認する
```


②未署名のトランザクションの確認

TRANSACTIONS（トランザクション）セクションのフィルターをRecentからPatialに変更し未署名のトランザクションを確認する


③未署名のトランザクションの内容を確認

Hash(トランザクションハッシュ)のリンクをクリックし矢印内部のアイコンにカーソルを合わせるとトランザクションの内容がポップアップされます。


自分が署名したい内容であれば、Hash(トランザクションハッシュ)のテキスト部分をコピーしておきます。



④TargetHashの部分に先ほどのHash(トランザクションハッシュ)を貼り付け、連署を行いアナウンスを行います。

```js
txInfo = await txRepo.getTransaction("TargetHash",sym.TransactionGroup.Partial).toPromise(); //ハッシュ値でトランザクションを検索
cosignatureTx = sym.CosignatureTransaction.create(txInfo); //連署用のトランザクションを作成
signedCosTx = alice.signCosignatureTransaction(cosignatureTx); //aliceに対する要求に連署する
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise(); //ブロックチェーンにアナウンス
```


⑤　③と同じページをリロードし、一番した部分にあるAGGREGATE COSIGNATURES(アグリゲート連署名)を確認し、自分のアドレスが入っていれば連署が成功となります。


⑥　参加者全員の署名が揃った時点でマルチシグアカウントが完成します。完成後メタバース上で人狼ゲーム会場へ移動します。

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
