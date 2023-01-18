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
### 4.Aliceアカウントへ50XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=50&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```
# アカウント情報確認
### 5.Aliceアカウント情報をSymbolエクスプローラーで表示する
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックしてアカウント情報を別タブで表示しておく
```
# 速習Symbol8章ロック
以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/08_lock.md

8章が終わったら、講師に対してハッシュロックトランザクションを行い
わずかなxymと勉強会の修了書を交換する要求を出して下しさい。

### 6.アグリゲートボンデッドトランザクションの作成
```js
target = "TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A" //MITのアドレス
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
        new sym.NamespaceId("symbol.xym"), //XYM
        sym.UInt64.fromUint(1) //数量
      )
    ],
    sym.PlainMessage.create('４回目の修了書を下さい'), //メッセージ
    networkType
);

tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  //自分へ
    [
      new sym.Mosaic(
        new sym.NamespaceId("mit.certificate.quick_learning_symbol_lesson4"), //４回目の修了書
        sym.UInt64.fromUint(1) //数量
      )
    ],
    sym.PlainMessage.create('４回目の受講お疲れ様でした'), //メッセージ
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
### 7.ハッシュロックトランザクションの作成と署名、アナウンス
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

### 8.アグリゲートボンデッドトランザクションのアナウンス
ハッシュロックTXがブロックチェーン上で認識される前にアグリゲートトランザクションをアナウンスしてしまうとそのハッシュはGOXします。

つまりロックにかけておいた10XYMも永遠に戻ってこないので、かならず上記コマンドがエラーなく実行された後にアナウスして下さい。

```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```
アグリゲートボンデッドトランザクションをアナウンスしないと、ロックしただけで相手への署名要求が発生しません。
相手の未署名の場合や自分宛の署名要求はエクスプローラーのトランザクション履歴でフィルターをRecentからPartialに変えて検索して下さい。
相手の署名が完了すると、アグリゲートトランザクションが実行されます。

■★　ここで逆に署名要求に対して署名するのも実施してみる


# 限定ジャンケンの準備
会場に行く前に、限定ジャンケンの準備をしておきます

### 8.参加用の新規Aliceアカウント,Alice公開鍵クラス,Aliceアドレスクラスの作成
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
### 9.参加用のAliceアカウントへ250XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=250&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```
### 10.参加用のAliceアカウント情報をSymbolエクスプローラーで表示する
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックしてアカウント情報を別タブで表示しておく
```
### 11.秘密鍵を出力し保管しておく
間違ってコンソールをリロードしてしまうと、アカウントが消えてしまいます。
そのため秘密鍵を出力し、別途テキストなどに貼り付けておきます。
```js
console.log(alice.privateKey);
```

項目1、項目2を実行し
項目3-bにて保管しておいた秘密鍵を「YourPrivateKey」と置き換えて実行し
項目13以降の処理を全て実行してください。
間違っても、3-aで新規アカウントを生成したり、xymを追加で入金したりしないで下さい。


### 12.参加表明
MITに対してアカウントから自分のメタバース名を暗号化して送ることで参加表明とします
```js
address = "TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A"
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(address)).toPromise();
publicAccount = sym.PublicAccount.createFromPublicKey(
  accountInfo.publicKey,
  networkType
);
encMsg = alice.encryptMessage("自分のメタバース上の名前を入力",publicAccount);
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment), //Deadline:有効期限
  sym.Address.createFromRawAddress(address),
  [],
  encMsg, //メッセージ
  networkType //テストネット・メインネット区分
).setMaxFee(100); //手数料
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
const transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash
console.log(transactionStatusUrl);
```

### 13.使うツール
