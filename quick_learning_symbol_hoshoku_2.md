# 準備
以下リンクを別ウィンドウで開き、F12からコンソールを表示させる
<p><a href="https://learn.ja.symbol-community.com/05_mosaic.html" target="_blank">5.モザイク・速習Symbol</a></p>

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
### 3.Aliceアカウント,Alice公開鍵クラス,Aliceアドレスクラスの作成
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

### 4.Aliceアカウントへ300XYMを補充（手数料に必要）
```js
`https://testnet.symbol.tools/?amount=300&recipient=${aliceAddress.plain()}` //以下リンクをクリックしてCLAIM！を実行
```
### 5.AliceアカウントのXYM量確認
```js
`https://testnet.symbol.fyi/accounts/${aliceAddress.plain()}` //以下リンクをクリックして300XYMが入金されているか確認
```
### 6.5章の準備用
```js
accountInfo = await accountRepo.getAccountInfo(alice.address).toPromise();
```
### 7.所有モザイク確認
```js
await getMosaicInfo(aliceAddress);
```
# 速習Symbol5章
速習Symbol5章を進める
# フルオンチェーンNFT作成
### 11.フルオンチェーンNFT用の画像をBase64化
```js
`https://rakko.tools/tools/72/` // 長辺が200ピクセル（100KB）以下のNFTにしても良い画像を準備して以下リンクから画像をBase64化する（著作権にお気をつけ下さい）
```
### 12.Base64の分割
```js
bigdata = 'base64text'; //ここをBase64化したテキストに置き換えて実行
let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) { //1023byteで文字列を分割
    payloads.push(bigdata.substr(i * 1023, 1023));
}
nftTxList = []//分割した文字列でトランザクションを生成
payloads.forEach(function(value) {nftTxList.push(
    sym.TransferTransaction.create(
    undefined, //Deadline
    alice.address,  //送信先
    [],
    sym.PlainMessage.create(value),
    networkType
).toAggregate(alice.publicAccount)
)})
console.log(nftTxList);
```
### 13.フルオンチェーンNFTの作成
```js
supplyMutable = false; //供給量変更の可否
transferable = true; //第三者への譲渡可否
restrictable = false; //制限設定の可否
revokable = false; //発行者からの還収可否
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, 
    nonce,
    sym.MosaicId.createFromNonce(nonce, alice.address), //モザイクID
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    0, //divisibility:可分性を0にして整数にする
    sym.UInt64.fromUint(0), //duration:有効期限0にして無期限にする
    networkType
);
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(1), //数量を1に（供給量変更も不可なので世界に１枚になる）
    networkType
);
nftTxList.push(mosaicDefTx.toAggregate(alice.publicAccount)) //トランザクション配列に追加
nftTxList.push(mosaicChangeTx.toAggregate(alice.publicAccount)) //トランザクション配列に追加
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    nftTxList,
    networkType,[],
).setMaxFeeForAggregate(100, 0);
signedNftTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedNftTx).toPromise();
```
### 14.トランザクションの確認（フルオンチェーンNFT作成確認）
```js
nftTxInfo = await txRepo.getTransaction(signedNftTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(nftTxInfo); 
```
### 15.所有Mosaicの確認
```js
await getMosaicInfo(aliceAddress);
```
### 16.NFTの送付
```js
transferTx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment), //Deadline:有効期限
    sym.Address.createFromRawAddress("TC5MWZUCDS5JD7FMA3K4A5OIGN2J7MPHEJOOLKI"), //講師のAddress
  [
    new sym.Mosaic(
      new sym.MosaicId('XXXXXXXXXXX'), //ここに作成したNFTのMosaicIDを入力
      sym.UInt64.fromUint(1),
    )
  ],
    sym.PlainMessage.create("Send NFT"), //メッセージ
    networkType
).setMaxFee(100); //手数料
signedTransferTx = alice.sign(transferTx,generationHash);
await txRepo.announce(signedTransferTx).toPromise();
```
### 17.トランザクションの確認（Transfer確認）
```js
transferTxInfo = await txRepo.getTransaction(signedTransferTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(transferTxInfo); 
```
### 18.講師から返信用のフルオンチェーンFTを受信する
```js
await getMosaicInfo(aliceAddress); //受信後に実行すると、モザイクが増えている
```
### 19.受信したフルオンチェーンFTのデコード
```js
base64Text = ""
blockHeight = "addressHeight"  //ここにデコードしたいモザイクの作成時ブロック高（addressHeight）を入力する
address = sym.Address.createFromRawAddress("ownerAddress")  //ここにデコードしたいモザイクの作成者アドレス（ownerAddress）を入力する
searchCriteria = { group: sym.TransactionGroup.Confirmed, address, pageNumber: 1, pageSize: 100 ,height:blockHeight}
receiveTxInfo = await txRepo.search(searchCriteria) //指定した条件のトランザクションを検索
receiveTxInfo.forEach((transactions) => {
  transactions.data.forEach(async (tx) => {
    console.log(tx.transactionInfo.hash)
    aggTxInfo = await txRepo.getTransaction(tx.transactionInfo.hash, sym.TransactionGroup.Confirmed).toPromise();
    aggTxInfo.innerTransactions.forEach((innerTx) => {
        if(innerTx.type == 16724){ //インナートランザクションの中でプレーンメッセージのトランスファーメッセージのみを取得
        	base64Text = base64Text + innerTx.message.payload
        }
    });         
  });
});
```
### 20.デコードしたBase64の表示
```js
console.log(base64Text)
```
### 21.Base64から画像に変換
```js
`https://rakko.tools/tools/71/`
```
# オンチェーンアンケート
### 101.オンチェーンでアンケートの回答
```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TC5MWZUCDS5JD7FMA3K4A5OIGN2J7MPHEJOOLKI"), 
    [],
    sym.PlainMessage.create(`
    ①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目>
    ②今日の勉強会の理解度を1~10で回答して下さい<5>
    ③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>
    ④次回も参加したいと思いますか？<はい/いいえ>
    ⑤その他ございましたらご感想をお聞かせ下さい<勉強になったので是非次回も参加したいです>    
    `), //こちらを書き換えてアンケートの回答を記入お願いします。(全角で300字まで入力できます。超えそうな場合は何通かに分けて送って頂けますと助かります。)
    networkType
).setMaxFee(100); //手数料
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```
### 102.こちらからみなさんの回答を誰もがオンチェーンで見る事ができます。
```js
`https://testnet.symbol.fyi/accounts/TC5MWZUCDS5JD7FMA3K4A5OIGN2J7MPHEJOOLKI`
```


### 参考画像準備が難しい場合はこちらのエンコードしたBASE64データをコピーして使って下さい
```js
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
