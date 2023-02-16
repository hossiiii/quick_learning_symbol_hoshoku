# 準備
以下リンクを別ウィンドウで開き、F12からコンソールを表示させる

https://sym-test-04.opening-line.jp:3001/node/health




表示用のウィンドウとF12コンソール実行用のウィンドウを左右に並べておく


<img width="1512" alt="スクリーンショット 2023-02-04 7 56 57" src="https://user-images.githubusercontent.com/47712051/216727591-01b401a2-bb0a-41c1-87d0-d9c21b784a03.png">

//✅ここの画像は変更する



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
### 4.Aliceアカウントへ50XYMを補充（手数料に必要）
CLAIM!ボタンをクリックし、緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる

```js
`https://testnet.symbol.tools/?amount=50&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行.緑色のNotificationとして”View transaction in explorer.”と表示されたらタブを閉じる
```

### 5.Symbolエクスプローラーで自分のアカウント情報を開き50XYMがある事を確認する
このエクスプローラーは何度も参照するので、左側の参照用ウィンドウに移動させておきます
```js
`https://testnet.symbol.fyi/accounts/${alice.address.plain()}` //以下リンクをクリック
```


# 速習Symbol10.監視

### 以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/10_observer.md


### 10.2 受信検知の補足
自分自身にトランスファーTXを送ってみる。

```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    alice.address,
    [],
    sym.PlainMessage.create(`hello symbol`),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```


### 10.3 ブロック監視の補足
これはログが見にくくなるので最後に実行


### 10.4 署名要求の補足
速習Symbol8章ロックの　8.1 ハッシュロックの実行　を行い検知できるかためしてみる。
https://github.com/xembook/quick_learning_symbol/blob/main/08_lock.md#81-%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5%E3%83%AD%E3%83%83%E3%82%AF


### 10.5 現場で使えるヒントの補足
以下URLからテストネットのノードリストをコピーする

https://xembook.github.io/xembook/xembook_config.js


### 未署名トランザクション自動連署の補足
再度、速習Symbol8章ロックの　8.1 ハッシュロックの実行　を行い検知できるかためしてみるがいくつか注意点がある。
https://github.com/xembook/quick_learning_symbol/blob/main/08_lock.md#81-%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5%E3%83%AD%E3%83%83%E3%82%AF


　　※1　再度bobを作成すると監視対象が変わるのでそこだけ抜いて実行する
    

```js
  rxjs  = require("/node_modules/rxjs");
```


# 分散型SNSをつくろう
・資料説明


①監視をリセットするためコンソールF12側のリロードを行う


②環境構築の１、２、３-bまで実行しaliceアカウントを作成する。


③必要なレポジトリ等の読み込む

```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace('http', 'ws') + "/ws";
listener = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
listener.open();
```

③自分のアドレスにmetaデータを書き込む

```js
keyword = "web3sns" //参加するコミュニティ
key = sym.KeyGenerator.generateUInt64Key(keyword);
value = 'ここに自分の表示させたい名前を入力'; //🌟ここにSNSで表示させたい名前に書き換えて実行

tx = await metaService.createAccountMetadataTransaction(
    undefined,
    networkType,
    alice.address,
    key,value,
    alice.address
).toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,[]
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

④監視用のアドレスリストを作成する

```js
scopedMetadataKey = sym.KeyGenerator.generateUInt64Key(keyword).toHex() //web3snsを16進数文字列に変換
followDict = {}
metadataEntries = await metaRepo.search({
    metadataType: sym.MetadataType.Account,
    scopedMetadataKey: scopedMetadataKey,
    pageNumber: 1,
    pageSize: 1000
}).toPromise()
for (let index = 0; index < metadataEntries.data.length; index++) {
    followDict[metadataEntries.data[index].metadataEntry.targetAddress.address] = metadataEntries.data[index].metadataEntry.value
}
followList = Object.keys(followDict)
```

⑤監視の設定

```js
listener.open().then(() => {
    for (let index = 0; index < followList.length; index++) {
        listener.unconfirmedAdded(sym.Address.createFromRawAddress(followList[index]))
        .subscribe(async tx=>{
            if( tx.type == 16724 && //TransferTxであれば
                tx.signer.address.address == followList[index] && // 送信者がリストに含まれていれば
                followList.includes(tx.recipientAddress.address) // 受信者がリストに含まれていれば
            ){
                console.log(tx) //デバッグ用
                message = tx.message.payload

                // #ハッシュ値#が入っていたら置き換え
                if(tx.message.payload.indexOf('#')>0){
                    if(tx.message.payload.match(/#/g).length == 2){
                        const hash = tx.message.payload.slice(tx.message.payload.indexOf('#')+1, tx.message.payload.lastIndexOf('#'))
                        try{
                            rtx = await txRepo.getTransaction(hash,sym.TransactionGroup.Confirmed).toPromise()
                        }catch{
                            rtx = await txRepo.getTransaction(hash,sym.TransactionGroup.Unconfirmed).toPromise()
                        }
                        message = message.replace(`#${hash}#`,` >>${rtx.message.payload} @ ${followDict[rtx.signer.address.address]}<< `)
                    }
                }
                // Mosaic
                mosaic = ""
                if(tx.mosaics.length > 0){
                    mosaic = `${tx.mosaics[0].id.toHex()}(${tx.mosaics[0].amount.toString()})`
                }

                // Mosaicがあれば
                console.log(`
${message}
${followDict[tx.signer.address.address]}  => ${followDict[tx.recipientAddress.address]} ${mosaic}
hash ${tx.transactionInfo.hash}
                `)
            }
        });
    }
});

```

⑥トランスファーTxを行い分散SNSへ投稿を行なってみる


これでユーザ名に対するアドレスを確認
```js
followDict
```

これで投稿を行う
```js
address = "ここをアドレスに置き換えて実行" //🌟ツイートなら自分のアドレスを、リプライなら対象のアドレスを指定する
message = "ここをメッセージに置き換えて実行" //🌟リツイートしたい場合はメッセージ内に #リツイートしたいhash値#　という形式でハッシュ値を埋め込む
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress(address),
    [
//        new sym.Mosaic( //🌟投げ銭もしたい場合はこのコメントを外す
//            new sym.MosaicId("72C0212E67A08BCE"), //テストネットXYM
//            sym.UInt64.fromUint(1000000) //1XYM(divisibility:6)
//        ),
    ],
    sym.PlainMessage.create(message),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```


# オンチェーンアンケート
今日の勉強をオンチェーンアンケートに回答します。

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目/5回目/６回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TD7CMSZBAZTEPST5SS6QCQTJIXEGCHIW6SIHSLY"), //✅ここのアドレスは変更する
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
`https://testnet.symbol.fyi/accounts/TD7CMSZBAZTEPST5SS6QCQTJIXEGCHIW6SIHSLY` //✅ここのアドレスは変更する
```
