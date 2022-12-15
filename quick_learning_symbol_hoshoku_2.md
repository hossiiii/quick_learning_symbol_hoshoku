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
   if (divisibility > 0) {
   displayAmount =
     mosaicAmount.slice(0, mosaicAmount.length - divisibility) +  "." + mosaicAmount.slice(-divisibility);
 } else {
   displayAmount = mosaicAmount;
 }
   console.log("id:" + mosaic.id.toHex() + " amount:" + displayAmount + " addressHeight:" + mosaicInfo.startHeight.compact() + " ownerAddress: " + mosaicInfo.ownerAddress.address);
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
### 6.所有モザイク確認
```js
await getMosaicInfo(aliceAddress);
```
# 環境構築
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
nftTxList.push(mosaicDefTx.toAggregate(alice.publicAccount)) //トランザクション配列に追加
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(1), //数量を1に（供給量変更も不可なので世界に１枚になる）
    networkType
);
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
