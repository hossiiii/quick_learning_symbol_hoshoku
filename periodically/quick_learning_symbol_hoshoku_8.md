# 準備
以下リンクを別ウィンドウで開き、F12からコンソールを表示させる

https://sym-test-03.opening-line.jp:3001/node/health



# 環境構築
別ウィンドウで開いているF12コンソールに以下順番に入力していく
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


![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/92b1753c-f270-4b9e-af17-229cc6dbe094)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/b7351301-d098-4d61-b4ff-c8fb03ce5a45)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/41671e37-1526-4a3d-965b-1cf2a75083ab)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/2f2e456e-bf96-48cc-a1c3-412fb8191592)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/df06fdb0-d9b4-4828-b755-19ef9d346d3d)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/ba878aef-f3cd-4a1c-9210-079b9ad680d0)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/51fe421c-48b1-4c24-b648-8795356e476f)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/b50779fb-6842-4360-880c-568971112321)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/f780141f-40bc-47db-8696-fad304e1ef22)



### 以下リンクを別タブで開きハンズオンを行っていきます。

https://github.com/xembook/quick_learning_symbol/blob/main/13_verify.md

## 13.検証

## 検証するペイロード 補足
今回検証するトランザクションペイロードとそのトランザクションが記録されているとされるブロック高を以下に変更します

```js
payload ="6801000000000000702A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F059DC9CD2B71936107BD31D3BE460B0601FE0792F6BF5BF45ED72B77BA00DFB43B0000000002984141A08C000000000000C268FCAD06000000B969193AA7F8091B3E64581078D175A3140E346D3B73284B754063079BF29B84580000000000000058000000000000009DC9CD2B71936107BD31D3BE460B0601FE0792F6BF5BF45ED72B77BA00DFB43B00000000019844419827DC93C158BBE73CA5D179E62359113772BFCF82F5B5D5D72781051BB772970000040000000000000000000000000058852861225DB34ADE78D16CFFC4B092082EAF24DCC9967D2C1D81039FD9C86C069B56E288CF53A395091937F74952399F7BD9B22C703611236CE309170B65E915187E5D5236CB3100143F4F1085C272FB6B82C490BF99ADFDB1130124CB3C0B"

height = 853913
```

alice公開鍵アカウントの作成
```js
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  "9DC9CD2B71936107BD31D3BE460B0601FE0792F6BF5BF45ED72B77BA00DFB43B",
  networkType
);
```


## 署名者の検証 補足
シグネチャーを今回の検証対象のトランザクションに変更します

```js
res = alicePublicAccount.verifySignature(
    tx.getSigningBytes([...Buffer.from(payload,'hex')],[...Buffer.from(generationHash,'hex')]),
    "702A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F05"
);
console.log(res);

```

## 署名者の検証 補足２
署名者を変更してみる
```js
bob = sym.Account.generateNewAccount(networkType);

res = bob.publicAccount.verifySignature(
    tx.getSigningBytes([...Buffer.from(payload,'hex')],[...Buffer.from(generationHash,'hex')]),
    "702A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F05"
);
console.log(res);

```

## 署名者の検証 補足3
署名を変更してみる
```js
res = alicePublicAccount.verifySignature(
    tx.getSigningBytes([...Buffer.from(payload,'hex')],[...Buffer.from(generationHash,'hex')]),
    "802A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F05"
);
```

## 署名者の検証 補足4
ペイロードを変更してみる

```js
res = alicePublicAccount.verifySignature(
    tx.getSigningBytes([...Buffer.from('6801000000000000702A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F059DC9CD2B71936107BD31D3BE460B0601FE0792F6BF5BF45ED72B77BA00DFB43B0000000002984141A08C000000000000D268FCAD06000000B969193AA7F8091B3E64581078D175A3140E346D3B73284B754063079BF29B84580000000000000058000000000000009DC9CD2B71936107BD31D3BE460B0601FE0792F6BF5BF45ED72B77BA00DFB43B00000000019844419827DC93C158BBE73CA5D179E62359113772BFCF82F5B5D5D72781051BB772970000040000000000000000000000000058852861225DB34ADE78D16CFFC4B092082EAF24DCC9967D2C1D81039FD9C86C069B56E288CF53A395091937F74952399F7BD9B22C703611236CE309170B65E915187E5D5236CB3100143F4F1085C272FB6B82C490BF99ADFDB1130124CB3C0B','hex')],[...Buffer.from(generationHash,'hex')]),
    "702A558251B6319A90FA15640BDCB0A62737567D7C6F32036C566B029EC2B89D9E7ABC676A689DA9D4672927BD26CB2EE02B7875AD08FF630ED62B81224B2F05"
);
console.log(res);

```

## importanceブロックの検証 補足4
直近のインポータンスブロックは以下になります。heightを上書きします

https://testnet.symbol.fyi/blocks/853920

```js
height = 853920
```

## アカウントメタデータの検証の 補足

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/80700d44-5138-4491-9da0-ffc05f96e531)

![image](https://github.com/hossiiii/quick_learning_symbol_hoshoku/assets/47712051/1b2a31b1-fbe2-4136-b260-cc64f1ceedf7)

実際のマークルパトリシアツリーはこちらのツールで可視化できる
https://planethouki.github.io/symbol-merkle-tree-web/account.html

## アカウント情報の検証の補足
今回指定ているaliceのアドレスを指定します。
```js
stateProofService = new sym.StateProofService(repo);

aliceAddress = alicePublicAccount.address;

hasher = sha3_256.create();
alicePathHash = hasher.update(
  sym.RawAddress.stringToAddress(aliceAddress.plain())
).hex().toUpperCase();

hasher = sha3_256.create();
aliceInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
aliceStateHash = hasher.update(aliceInfo.serialize()).hex().toUpperCase();

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
blockInfo = await blockRepo.search({order:"desc"}).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[0];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await stateProofService.accountById(aliceAddress).toPromise();

//検証
checkState(stateProof,aliceStateHash,alicePathHash,rootHash);

```

## モザイクへ登録したメタデータの検証の補足
すみません、Aliceアカウントの秘密鍵をGOXしてしまいこちらのTXが作れず検証できませんでした。

## アカウントへ登録したメタデータの検証の補足
すみません、Aliceアカウントの秘密鍵をGOXしてしまいこちらのTXが作れず検証できませんでした。


# オンチェーンアンケート
今日の勉強をオンチェーンアンケートに回答します。

①こちらの速習Symbol勉強会は何回目の参加ですか？<１回目/２回目/3回目/4回目/5回目/６回目/7回目/8回目>

②今日の勉強会の理解度を1~10で回答して下さい<5>

③ブロックチェーンで何かサービスを作りたいと思っていますか？<はい/いいえ>

④次回も参加したいと思いますか？<はい/いいえ>

⑤その他ございましたらご感想をお聞かせ下さい


```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.Address.createFromRawAddress("TDJRM7EXDGQITMMUWG5KJJW33PLA2ZDSW67CK4Q"),
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
`https://testnet.symbol.fyi/accounts/TDJRM7EXDGQITMMUWG5KJJW33PLA2ZDSW67CK4Q`
```
