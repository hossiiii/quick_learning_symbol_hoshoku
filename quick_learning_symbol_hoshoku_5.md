# 準備
メタバース上の名前をローマ字で設定しておく

　　※前回の講義で@アドレス表記になっている方は＠を含むアドレスを削除してローマ字に変更して下さい




以下リンクを別ウィンドウで開き、F12からコンソールを表示させる

https://sym-test-04.opening-line.jp:3001/node/health




表示用のウィンドウとF12コンソール実行用のウィンドウを左右に並べておく


<img width="1512" alt="スクリーンショット 2023-02-04 7 56 57" src="https://user-images.githubusercontent.com/47712051/216727591-01b401a2-bb0a-41c1-87d0-d9c21b784a03.png">



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
CLAIM!ボタンをクリックし、緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる

```js
`https://testnet.symbol.tools/?amount=30&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

### 5.Symbolエクスプローラーで自分のアカウント情報を開き30XYMがある事を確認する
このエクスプローラーは何度も参照するので、左側の参照用ウィンドウに移動させておきます
```js
`https://testnet.symbol.fyi/accounts/${alice.address.plain()}` //以下リンクをクリック
```

### 6.自分のメタバースの名前をメッセージで送る
messageの内容を自分のメタバース名に変更し、AliceアカウントからMIT（みやこでIT）のアドレスへ自分のメタバースの名前を送る。

```js
message = "ここにメタバース上の名前に書き換えて"; //【🌟要変更箇所🌟】

tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A"),
    [],
    sym.PlainMessage.create(message),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

# 速習Symbol9章マルチシグ化
![LTS勉強会資料のコピー 016](https://user-images.githubusercontent.com/47712051/216161992-74ce64aa-8129-4820-9cf8-637008106da5.png)
![LTS勉強会資料のコピー 017](https://user-images.githubusercontent.com/47712051/216161999-b456af21-eae2-46e3-800f-903516fbfdbc.png)
![LTS勉強会資料のコピー 018](https://user-images.githubusercontent.com/47712051/216162002-212ff545-30a3-4ac4-b3dc-52673d1c498e.png)
![LTS勉強会資料のコピー 019](https://user-images.githubusercontent.com/47712051/216162007-bbd4405a-645f-4e14-a6db-a982e3df73b6.png)
![LTS勉強会資料のコピー 020](https://user-images.githubusercontent.com/47712051/216162012-a2ae1750-68e1-415b-9d32-a9a813df9a46.png)
![LTS勉強会資料のコピー 021](https://user-images.githubusercontent.com/47712051/216162014-b85a106c-730d-464c-806b-d3e0595b358d.png)

### 7.以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/09_multisig.md

### 8. 9.3 マルチシグ署名 アグリゲートボンデッドトランザクションで送信 の補足
確実にハッシュロックトランザクションがブロックチェーンに承認された事を確認します。

①Symbolエクスプローラーでcarol1のアカウント情報を開きます。

```js
`https://testnet.symbol.fyi/accounts/${carol1.address.plain()}`
```

========================================================================================

実際にアグリゲートボンデッドトランザクションで送信された要求に対して署名を行う手順を記載します。

①Symbolエクスプローラーでcarol2のアカウント情報を開きます。
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
### 9.人狼ゲーム参加表明
![LTS勉強会資料のコピー 001](https://user-images.githubusercontent.com/47712051/216157283-c693680f-fd98-47e6-8887-a14e2f5ee669.png)

演習ではマルチシグアカウントをを作成するために参加者全員の署名をオンチェーン上で集める必要があります。

そのためには必ず項番7で行ったアグリゲートボンデッドトランザクションで送信された要求に対して署名が出来る事が必須条件となります。

この条件を満たせている人は参加表明としてメタバース上で⭕️⭕️番の絵の前に立って下さい。

条件を満たせていない人は大変申し訳ありませんが、人狼ゲームは見学とするか、速習Symbol9章の復習をお願いします。

※一緒にゲーム会場に移動頂くことは問題ありません。

# 演習準備

### 10.人狼ゲーム用マルチシグ参加への連署
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

# 自分の役を確認する
### 11.参加メンバーのアドレスリストをコピーして貼り付けておく
以下リンクへ移動

[参加者アドレスリストへ移動](https://github.com/hossiiii/quick_learning_symbol_hoshoku/blob/main/quick_learning_symbol_addressList_5.md)

### 12. 届いている暗号化メッセージを復号して自分の役を確認する
暗号化されているため、他の人には見えません。

人狼の役が当たった方には、役と他の人狼の名前が送られています。
```js
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(tomohiro)).toPromise();
await txRepo.search({
  group: sym.TransactionGroup.Confirmed,
  signerPublicKey:accountInfo.publicKey,
  recipientAddress:alice.address,
}).toPromise().then(page=>{
  if (page.pageSize > 0) {
    page.data.forEach((tx) => {
      if(tx.message.type == 1){
        msg = alice.decryptMessage(tx.message,accountInfo.publicAccount).payload
        console.log(msg)
      }
    });
  }
});
```

# チュートリアル
練習として、tomohiroアカウントに対する追放（除名）の要求と、連署を行います。

ゲーム開始後も同じ方法で追放（除名）の要求と、連署を行います。

### 13. 追放（除名）の要求
自分が起案者となり、ターゲットを決め追放（除名）を行うための投票を募ります。
```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
  undefined,
  0,
  0,
  [],
  [sym.Address.createFromRawAddress(tomohiro)], //【🌟要変更箇所🌟】除名したい人をメタバース上の名前で指定する（実際はマッピングされたアドレスに変換される）
  networkType
);

messageTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  sym.Address.createFromRawAddress(hossiiii),
  [],
  sym.PlainMessage.create(""), //【🌟要変更箇所🌟】必要であればここに投票の意図を記入する
  networkType
);

accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(hossiiii)).toPromise();

aggregateTx = sym.AggregateTransaction.createBonded(
  sym.Deadline.create(epochAdjustment),
  [
    multisigTx.toAggregate(accountInfo.publicAccount),
    messageTx.toAggregate(accountInfo.publicAccount),
  ],
  networkType,[]
).setMaxFeeForAggregate(100, 0);

signedAggregateTx = alice.sign(aggregateTx, generationHash);

hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
  new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //ロックするため最低10XYMが必要
  sym.UInt64.fromUint(14), // 7分 以内に種名が集まらないとトランザクションは無効になる
  signedAggregateTx,
  networkType
).setMaxFee(100);

signedLockTx = alice.sign(hashLockTx, generationHash);

await txRepo.announce(signedLockTx).toPromise();
console.log("ハッシュロックTXをアナウンスしました、承認されるまで30秒ほどお待ちください"); 

//ハッシュロックTXが承認されたことを検知させる
listener.open().then(() => {
  transactionService
    .announceHashLockAggregateBonded(
      signedLockTx,
      signedAggregateTx,
      listener
    )
    .subscribe({
      next: async (x) => {
        console.log("ハッシュロックが成功しました、続いてアグリゲートボンデッドを通知しました"); 
        await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
      },
      error: (err) => {
        console.error("以下の理由でハッシュロックが失敗しました");
        console.error(err);
        listener.close();
      },
      complete: () => {
        listener.close();
      },
    });
});

```

### 14. 追放（除名）の要求に対する連署
モニタに映し出される他人が出している追放（除名）要求にaliceアカウントで連署します

※項番7で行ったアグリゲートボンデッドトランザクションで送信された要求に対して署名を行うとほぼ同じ方法です。

①メタバース上でモニタに映し出されている連署したいハッシュ値を確認する。

②Symbolエクスプローラーで自分のアカウント情報を開く
```js
`https://testnet.symbol.fyi/accounts/${alice.address.plain()}` //aliceに対する要求を確認する
```

③未署名のトランザクションの確認

TRANSACTIONS（トランザクション）セクションのフィルターをRecentからPatialに変更し連署したいHash(トランザクションハッシュ)のリンクをクリック


④未署名のトランザクションの内容を確認

Hash(トランザクションハッシュ)のテキスト部分をコピーしておきます。


④TargetHashの部分に先ほどのHash(トランザクションハッシュ)を貼り付け、連署を行いアナウンスを行います。

```js
txInfo = await txRepo.getTransaction("TargetHash",sym.TransactionGroup.Partial).toPromise(); //ハッシュ値でトランザクションを検索
cosignatureTx = sym.CosignatureTransaction.create(txInfo); //連署用のトランザクションを作成
signedCosTx = alice.signCosignatureTransaction(cosignatureTx); //aliceに対する要求に連署する
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise(); //ブロックチェーンにアナウンス
```


⑤メタバース上のモニタで連署者に自分の名前が入っていれば連署が成功しています。


# 追放された人の楽しみ方

追放された人にはMITのアカウントより誰が人狼であったのか暗号メッセージで送ります。

人狼がどのような行動を取っているかこっそり覗いてみて下さい（他言はなしでお願いします）
```js
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress("TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A")).toPromise();
await txRepo.search({
  group: sym.TransactionGroup.Confirmed,
  signerPublicKey:accountInfo.publicKey,
  recipientAddress:alice.address,
}).toPromise().then(page=>{
  if (page.pageSize > 0) {
    page.data.forEach((tx) => {
      msg = alice.decryptMessage(tx.message,accountInfo.publicAccount).payload
      console.log(msg)
    });
  }
});
```


# オンチェーンアンケート
今日の勉強をオンチェーンアンケートに回答します。

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目/5回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TD7CMSZBAZTEPST5SS6QCQTJIXEGCHIW6SIHSLY"),
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
`https://testnet.symbol.fyi/accounts/TD7CMSZBAZTEPST5SS6QCQTJIXEGCHIW6SIHSLY` //以下リンクをクリック
```
