<hr />

### NoteBookの見方
コード以外の情報 
<span >白/黒での記載は速習Symbol</span>  
<span style="color:red">赤色での記載は補足情報</span>  
<span >コード内で🌟マークがある場所は自分の情報に書き換えが必要</span>

<hr />

# 環境構築

### 0.コンソール接続用ページを開く 
以下リンクを別タブで開き、F12からコンソールを表示させる

https://sym-test-03.opening-line.jp:3001/node/health


以降実行コマンドについては、F12で開いたコンソールに貼り付けて実行していく

### 1.Symbol SDKの読み込み
```js
(script = document.createElement("script")).src = "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.3.js";
document.getElementsByTagName("head")[0].appendChild(script);

```
### 2.Symbol用の共通設定
```js
NODE = 'https://sym-test-03.opening-line.jp:3001';
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


### 3.aliceアカウントのリストア
```js
alice = sym.Account.createFromPrivateKey(
    "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****", //🌟ここに3章で作成した秘密鍵を入力
    networkType
);
```

<hr />

# 10.監視
SymbolのノードはWebSocket通信でブロックチェーンの状態変化を監視することが可能です。  

## 10.1 リスナー設定

WebSocketを生成してリスナーの設定を行います。

```js
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace('http', 'ws') + "/ws";
listener = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
listener.open();
```

エンドポイントのフォーマットは以下の通りです。
- wss://{node url}:3001/ws

何も通信が無ければ、listenerは1分で切断されます。

## 10.2 受信検知

アカウントが受信したトランザクションを検知します。

```js
listener.open().then(() => {
    //承認トランザクションの検知
    listener.confirmed(alice.address)
    .subscribe(tx=>{
        //受信後の処理を記述
        console.log(tx);
    });
    //未承認トランザクションの検知
    listener.unconfirmedAdded(alice.address)
    .subscribe(tx=>{
        //受信後の処理を記述
        console.log(tx);
    });
});
```
上記リスナーを実行後、aliceへの送信トランザクションをアナウンスしてください。

### 補足①
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

###### 出力例
```js
> Promise {<pending>}
> TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
    deadline: Deadline {adjustedValue: 12449258375}
    maxFee: UInt64 {lower: 32000, higher: 0}
    message: RawMessage {type: -1, payload: ''}
    mosaics: []
    networkType: 152
    payloadSize: undefined
    recipientAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    signature: "914B625F3013635FA9C99B2F138C47CD75F6E1DF7BDDA291E449390178EB461AA389522FA126D506405163CC8BA51FA9019E0522E3FA9FED7C2F857F11FBCC09"
    signer: PublicAccount {publicKey: 'D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2', address: Address}
    transactionInfo: TransactionInfo
        hash: "3B21D8842EB70A780A662CCA19B8B030E2D5C7FB4C54BDA8B3C3760F0B35FECE"
        height: UInt64 {lower: 316771, higher: 0}
        id: undefined
        index: undefined
        merkleComponentHash: "3B21D8842EB70A780A662CCA19B8B030E2D5C7FB4C54BDA8B3C3760F0B35FECE"
    type: 16724
    version: 1
```

未承認トランザクションは transactionInfo.height=0　で受信します。

### 10.3 ブロック監視　※　これはログが見にくくなるので最後に実行します


## 10.4 署名要求

署名が必要なトランザクションが発生すると検知します。

```js
listener.open().then(() => {
    //署名が必要なアグリゲートボンデッドトランザクション発生の検知
    listener.aggregateBondedAdded(alice.address)
    .subscribe(async tx=>console.log(tx));
});
```

### 補足②
速習Symbol8章ロックの　8.1 ハッシュロックの実行　を行い検知できるかためしてみる。  

アグリゲートトランザクションの作成
```js
bob = sym.Account.generateNewAccount(networkType);
tx1 = sym.TransferTransaction.create(
    undefined,
    bob.address,  //Bobへの送信
    [ //1XYM
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"),
        sym.UInt64.fromUint(1000000)
      )
    ],
    sym.EmptyMessage, //メッセージ無し
    networkType
);
tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  // Aliceへの送信
    [],
    sym.PlainMessage.create('thank you!'), //メッセージ
    networkType
);
aggregateArray = [
    tx1.toAggregate(alice.publicAccount), //Aliceからの送信
    tx2.toAggregate(bob.publicAccount), // Bobからの送信
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

ハッシュロックトランザクションの作成と署名アナウンス
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

アグリゲートボンデッドトランザクションで連署を要求
```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

bobで連署
```js
txInfo = await txRepo.getTransaction(signedAggregateTx.hash,sym.TransactionGroup.Partial).toPromise();
cosignatureTx = sym.CosignatureTransaction.create(txInfo);
signedCosTx = bob.signCosignatureTransaction(cosignatureTx);
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise();
```

ブラウザで署名完了を確認
```js
console.log(`https://testnet.symbol.fyi/transactions/${hash}`) //ブラウザで確認を追
```


###### 出力例
```js
> AggregateTransaction
    cosignatures: []
    deadline: Deadline {adjustedValue: 12450154608}
  > innerTransactions: Array(2)
        0: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        1: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
    maxFee: UInt64 {lower: 94400, higher: 0}
    networkType: 152
    signature: "972968C5A2FB70C1D644BE206A190C4FCFDA98976F371DBB70D66A3AAEBCFC4B26E7833BCB86C407879C07927F6882C752C7012C265C2357CAA52C29834EFD0F"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "44B2CD891DA0B788F1DD5D5AB24866A9A172C80C1749DCB6EB62255A2497EA08"
        height: UInt64 {lower: 0, higher: 0}
        id: undefined
        index: undefined
        merkleComponentHash: "0000000000000000000000000000000000000000000000000000000000000000"
    type: 16961
    version: 1
```

指定アドレスが関係するすべてのアグリゲートトランザクションが検知されます。  
連署が必要かどうかは別途フィルターして判断します。  


## 10.5 現場で使えるヒント
### 常時コネクション

一覧からランダムに選択し、接続を試みます。

##### ノードへの接続
```js
//ノード一覧
NODES = ["https://sym-test-03.opening-line.jp:3001","https://test01.xymnodes.com:3001"]; //勉強会の都合上特定のノードをMIT側で指定

function connectNode(nodes) {
    const node = nodes[Math.floor(Math.random() * nodes.length)] ;
    console.log("try:" + node);
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.timeout = 2000; //タイムアウト値:2秒(=2000ms)
        req.open('GET', node + "/node/health", true);
        req.onload = function() {
            if (req.status === 200) {
                const status = JSON.parse(req.responseText).status;
                if(status.apiNode == "up" && status.db == "up"){
                    return resolve(node);
                }else{
                    console.log("fail node status:" + status);
                    return connectNode(nodes).then(node => resolve(node));
                }
            } else {
                console.log("fail request status:" + req.status)
                return connectNode(nodes).then(node => resolve(node));
            }
        };
        req.onerror = function(e) {
            console.log("onerror:" + e)
            return connectNode(nodes).then(node => resolve(node));
        };
        req.ontimeout = function (e) {
            console.log("ontimeout")
            return connectNode(nodes).then(node => resolve(node));
        };  
    req.send();
    });
}
```

タイムアウト値を設定しておき、応答の悪いノードに接続した場合は選びなおします。
エンドポイント /node/health　を確認してステータス異常の場合はノードを選びなおします。


##### レポジトリの作成
```js
function createRepo(nodes){
    return connectNode(nodes).then(async function onFulfilled(node) {
        const repo = new sym.RepositoryFactoryHttp(node);
        try{
            epochAdjustment = await repo.getEpochAdjustment().toPromise();
        }catch(error){
          console.log("fail createRepo");
          return await createRepo(nodes);
        }
        return await repo;
    });
}
```
まれに /network/properties のエンドポイントが解放されていないノードが存在するため、
getEpochAdjustment() の情報を取得してチェックを行います。取得できない場合は再帰的にcreateRepoを読み込みます。


##### リスナーの常時接続
```js
async function listenerKeepOpening(nodes){
    const repo = await createRepo(NODES);
    let wsEndpoint = repo.url.replace('http', 'ws') + "/ws";
    const nsRepo = repo.createNamespaceRepository();
    const lner = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
    try{
        await lner.open();
        lner.newBlock();
    }catch(e){
        console.log("fail websocket");
        return await listenerKeepOpening(nodes);
    }
    lner.webSocket.onclose = async function(){
        console.log("listener onclose");
        return await listenerKeepOpening(nodes);
    }
  return lner;
}
```

リスナーがcloseした場合は再接続します。

##### リスナー開始
```js
listener = await listenerKeepOpening(NODES);
```

### 未署名トランザクション自動連署

未署名のトランザクションを検知して、署名＆ネットワークにアナウンスします。  
初期画面表示時と画面閲覧中の受信と２パターンの検知が必要です。  

```js
//rxjsの読み込み
op  = require("/node_modules/rxjs/operators");
rxjs = require("/node_modules/rxjs");
//アグリゲートトランザクション検知
bondedListener = listener.aggregateBondedAdded(bob.address);
bondedHttp = txRepo.search({address:bob.address,group:sym.TransactionGroup.Partial})
.pipe(
    op.delay(2000),
    op.mergeMap(page => page.data)
);
//選択中アカウントの完了トランザクション検知リスナー
const statusChanged = function(address,hash){
    const transactionObservable = listener.confirmed(address);
    const errorObservable = listener.status(address, hash);
    return rxjs.merge(transactionObservable, errorObservable).pipe(
        op.first(),
        op.map((errorOrTransaction) => {
            if (errorOrTransaction.constructor.name === "TransactionStatusError") {
                throw new Error(errorOrTransaction.code);
            } else {
                return errorOrTransaction;
            }
        }),
    );
}
//連署実行
function exeAggregateBondedCosignature(tx){
    txRepo.getTransactionsById([tx.transactionInfo.hash],sym.TransactionGroup.Partial)
    .pipe(
        //トランザクションが抽出された場合のみ
        op.filter(aggTx => aggTx.length > 0)
    )
    .subscribe(async aggTx =>{
        //インナートランザクションの署名者に自分が指定されている場合
        if(aggTx[0].innerTransactions.find((inTx) => inTx.signer.equals(bob.publicAccount))!= undefined){
            //Aliceのトランザクションで署名
            const cosignatureTx = sym.CosignatureTransaction.create(aggTx[0]);
            const signedTx = bob.signCosignatureTransaction(cosignatureTx);
            const cosignedAggTx = await txRepo.announceAggregateBondedCosignature(signedTx).toPromise();
            statusChanged(bob.address,signedTx.parentHash).subscribe(res=>{
              console.log(res);
            });
        }
    });
}
bondedSubscribe = function(observer){
    observer.pipe(
        //すでに署名済みでない場合
        op.filter(tx => {
            return !tx.signedByAccount(sym.PublicAccount.createFromPublicKey(bob.publicKey ,networkType));
        })
    ).subscribe(tx=>{
        console.log(tx);
        exeAggregateBondedCosignature(tx);
    });
}
bondedSubscribe(bondedListener);
bondedSubscribe(bondedHttp);
```

### 補足③
再度　速習Symbol8章ロックの　8.1 ハッシュロックの実行　を行い検知できるかためしてみる。  


アグリゲートトランザクションの作成
```js
// bob = sym.Account.generateNewAccount(networkType); //bobを再生成すると監視対象が変わってしまうのでコメントアウト
tx1 = sym.TransferTransaction.create(
    undefined,
    bob.address,  //Bobへの送信
    [ //1XYM
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"),
        sym.UInt64.fromUint(1000000)
      )
    ],
    sym.EmptyMessage, //メッセージ無し
    networkType
);
tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  // Aliceへの送信
    [],
    sym.PlainMessage.create('thank you!'), //メッセージ
    networkType
);
aggregateArray = [
    tx1.toAggregate(alice.publicAccount), //Aliceからの送信
    tx2.toAggregate(bob.publicAccount), // Bobからの送信
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

ハッシュロックトランザクションの作成と署名アナウンス
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

アグリゲートボンデッドトランザクションで連署を要求
```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

bobで連署
```js
このnobでの連署を自動で検知して実行する
```

ブラウザで署名完了を確認
```js
console.log(`https://testnet.symbol.fyi/transactions/${hash}`) //ブラウザで確認を追
```

# 補足　分散型SNSをつくろう
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126018-7d8ec5fa-3e03-4173-b449-9e689a6650eb.png">
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126033-b0a4524a-63db-4dcd-ae91-ffe2fd42f965.png">
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126043-89a4e251-96e5-4e78-9bca-9ea85769652c.png">
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126057-ef8ef24d-b4a0-4661-8d74-bfff94dd13b1.png">
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126072-042c392d-38f7-4d04-8e26-8b7427e4d564.png">
<img width="800" alt="スクリーンショット 2023-04-21 4 51 10" src="https://user-images.githubusercontent.com/47712051/222126077-f57784a3-40c4-4f9a-8ab5-e73eb6d93d99.png">


①監視をリセットするためコンソールF12側のリロードを行う

②Symbol SDKの読み込み
```js
(script = document.createElement("script")).src = "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.3.js";
document.getElementsByTagName("head")[0].appendChild(script);

```

③Symbol用の共通設定
```js
NODE = 'https://sym-test-03.opening-line.jp:3001';
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

④aliceアカウントのリストア
```js
alice = sym.Account.createFromPrivateKey(
    "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****", //🌟ここに3章で作成した秘密鍵を入力
    networkType
);
```

⑤必要なレポジトリ等の読み込む

```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace('http', 'ws') + "/ws";
listener = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
listener.open();
```

⑥監視用のアドレスリストを作成する

```js
scopedMetadataKey = sym.KeyGenerator.generateUInt64Key("mit_training_camp").toHex() //web3snsを16進数文字列に変換
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

⑦監視の設定

```js
listener.open().then(() => {
    for (let index = 0; index < followList.length; index++) {
        listener.unconfirmedAdded(sym.Address.createFromRawAddress(followList[index]))
        .subscribe(async tx=>{
            if( tx.type == 16724 && //TransferTxであれば
                tx.signer.address.address == followList[index] && // 送信者がリストに含まれていれば
                followList.includes(tx.recipientAddress.address) // 受信者がリストに含まれていれば
            ){
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

⑧トランスファーTxを行い分散SNSへ投稿を行なってみる


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

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目/5回目/６回目/7回目/8回目/9回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TDVMZ4YLZ6NLVPXMMZTAMRKS7Q6S7DIAZ2Q4P3A"),
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
`https://testnet.symbol.fyi/accounts/TDVMZ4YLZ6NLVPXMMZTAMRKS7Q6S7DIAZ2Q4P3A`
```
