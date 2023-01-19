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
//間違ってコンソールをリロードしてしまうと、アカウントが消えてしまいます。
//そのため秘密鍵を出力し、別途テキストなどに貼り付けておきます。
console.log(alice.privateKey);
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


# 演習課題
実際の使い方を想定したハッシュロックの使い方を行います。

## 自分から取引を開始する場合。
講師に対してわずかなxymを送る代わりにその２倍のxymをもらう取引を行います。

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
    [
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"), //XYM
        sym.UInt64.fromUint(1) //数量
      )
    ],
    sym.PlainMessage.create('わずかなxymを送ります'), //メッセージ
    networkType
);

tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  //自分へ
    [
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"), //XYM
        sym.UInt64.fromUint(2) //数量
      )
    ],
    sym.PlainMessage.create('送られたら送り返す、倍返しだ！'), //メッセージ
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

## 相手の取引に応じる場合。
上記取引が完了したアカウントから順番に講師から
わずかなxymをいただく代わりに、４回目の修了証（mit.certificate.quick_learning_symbol_lesson4）を送付する取引を行います。

### 9.自分への署名要求があるか確認する
エクスプローラーを開き自分宛の署名要求を確認して下さい。

この時、どんな契約内容なのか中身をしっかりと確認して下さい（そうでないと不利な取引に署名してしまう事になります）

### 10.連署
txInfo = await txRepo.getTransaction("ここにエクスプローラーで確認したロックされたハッシュ値を入力",sym.TransactionGroup.Partial).toPromise();
cosignatureTx = sym.CosignatureTransaction.create(txInfo);
signedCosTx = alice.signCosignatureTransaction(cosignatureTx);
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise();

ここで修了証をもらえた人だけが、次の限定ジャンケンに参加する事ができます。

# 限定ジャンケンの準備
会場に行く前に、限定ジャンケンの準備をしておきます

### 11.参加表明
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
### 途中間違ってコンソールをリロードしてしまったら

記録しておいた秘密鍵を使ってアカウントを復活させます。
項目1、項目2を実行し
項目3-bにて保管しておいた秘密鍵を「YourPrivateKey」と置き換えて実行し
項目12以降の処理を全て実行してください。
間違っても、3-aで新規アカウントを生成したり、xymを追加で入金したりしないで下さい。

### 12.使うツール
演習で行った個人間取引のためのハッシュロックの他に
ゲーム内で使うためのツールを作成しておきます。

showAllCard

モザイクの所有状況を確認する関数です。

```js
nsRepo = repo.createNamespaceRepository();
showAllCard = async function(addressList) { // モザイク情報を参照する関数を作成
  for (const address of addressList){
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

使い方

引数にアカウントのリストを指定します。
```js
showAllCard(allAccountList)
```
* allAccountlist はメタバース上のチャットで指定しますので上記実行する前にチャットのリストを実行しておいて下さい。


setHand

ジャンケン台の上でジャンケンの手札をゲームマスターに送る関数です。

```js
setHand = async function(myhand) {
  hand = ['g', 'c', 'p'];
  if(hand.includes(myhand)) {
    accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress(🌟🌟ここは事前にゲームマスターのアドレスを入れておく)).toPromise();
    publicAccount = sym.PublicAccount.createFromPublicKey(
      accountInfo.publicKey,
      networkType
    );
    encMsg = alice.encryptMessage(myhand,publicAccount);
    tx = sym.TransferTransaction.create(
      sym.Deadline.create(epochAdjustment), //Deadline:有効期限
      sym.Address.createFromRawAddress(address),
      [],
      encMsg, //メッセージ
      networkType //テストネット・メインネット区分
    ).setMaxFee(100); //手数料
    signedTx = alice.sign(tx,generationHash);
    await txRepo.announce(signedTx).toPromise();
  }else{
    console.log("最初の引数は小文字で g（ぐー） c（ちょき） p（ぱー） のいずれかを入力して下さい")
    return
  }
}
```

使い方

引数に "g" "c" "p" のいずれかを指定します。
```js
setHand("g")
```
* 自分の所有していない手札は指定しないで下さい。
