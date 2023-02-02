# 準備
# 環境構築
### 1.Symbol SDKの読み込み
### 2.Symbol用の共通設定
### 3-a.新規Aliceアカウント,Alice公開鍵クラス,Aliceアドレスクラスの作成
### 3-b.もし間違って途中でリロードしてしまった場合は項目1、項目2の後に保管しておいた秘密鍵を”YourPrivateKey”と置き換えて実行して下さい
### 4.Aliceアカウントへ20XYMを補充（手数料に必要）
### 5.Symbolエクスプローラーで自分のアカウント情報を開き30XYMがある事を確認する
### 6.自分のメタバースの名前をメッセージで送る
# 速習Symbol9章マルチシグ化
### 7.以下リンクを別タブで開きハンズオンを行っていきます。
🌟⓪MIT宛のメッセージを確認する
```js
accountInfo = await accountRepo.getAccountInfo(sym.Address.createFromRawAddress("TB2JSKNG2IRIGXMI3AQMGASM6PXLSR7VFHLSA5A")).toPromise();
await txRepo.search({
  group: sym.TransactionGroup.Confirmed,
  recipientAddress:accountInfo.address,
  order:sym.Order.Desc
}).toPromise().then(page=>{
  if (page.pageSize > 0) {
    page.data.forEach((tx) => {
      if(tx.message.type == 0){
        msg = tx.message.payload
        console.log(`${msg} = "${tx.signer.address.address}"`)
        console.log(`${tx.signer.address.address} = "${msg}"`)
      }
    });
  }
});
```

🌟①メタバース上のアドレスを以下の形でリスト化しておきます。（リストには講師と飯田さんも含む形でお願いします）

```js
tomohiro = "TA2JD6AB3XOCOKW3OMP3KJY3OPHCD3IJDL4B7TA"
hossiiii = "TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI"
yamada = "TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI"
tanaka = "TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI"
hogehoge = "TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI"
・・・
TA2JD6AB3XOCOKW3OMP3KJY3OPHCD3IJDL4B7TA = "tomohiro"
TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI = "hossiiii"
TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI = "yamada"
TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI = "tanaka"
TD3BSNCGZALJE7ULVDVYYZK63I7IBXVKSGKOYZI = "hogehoge"
・・・
```

### 8. 9.3 マルチシグ署名 アグリゲートボンデッドトランザクションで送信 の補足
# 演習の前に
### 9.人狼ゲーム参加表明
🌟②参加しない人をリストから削除しておきます。

🌟③完成したリストをDiscordのDMで講師に伝えます。

🌟④リストの中から人狼を選抜し同じくDiscordのDMで講師に伝えます。

🌟⑤暗号化メッセージで、市民or人狼を参加者に伝えます。（この時人狼には他の人狼が誰かも併せて伝えます）

# 演習準備
### 10.人狼ゲーム用マルチシグ参加への連署
🌟⑥チュートリアルで必要になるので飯田さんもマルチシグへ参加するための連署を行なってもらいます。

# 自分の役を確認する
### 11.参加メンバーのアドレスリストをコピーして貼り付けておく
### 12. 届いている暗号化メッセージを復号して自分の役を確認する
# チュートリアル
### 13. 追放（除名）の要求
### 14. 追放（除名）の要求に対する連署
