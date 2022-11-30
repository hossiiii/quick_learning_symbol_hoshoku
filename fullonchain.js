//画像ファイルをBase64形式で文字列化
//https://rakko.tools/tools/72/

//文字列を代入
bigdata = '';

//1023byteで文字列を分割
let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
    payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);

//分割した文字列でトランザクションを生成
innerTxList = []
payloads.forEach(function(value) {innerTxList.push(
    sym.TransferTransaction.create(
    undefined, //Deadline
    alice.address,  //送信先
    [],
    sym.PlainMessage.create(value),
    networkType
).toAggregate(alice.publicAccount)
)})
console.log(innerTxList);

//分割した文字列をアグリゲートトランザクションにまとめてアナウンス
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    innerTxList,
    networkType,
    []
).setMaxFeeForAggregate(100, 1);
signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();

//アナウス後のトランザクションを確認
hash = signedTx.hash;
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(hash).toPromise();
console.log(transactionStatus);
txInfo = await txRepo.getTransaction(hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);

//アグリゲートトランザクションから文字列を取得し結合
base64Text = ""
txInfo.innerTransactions.forEach(function(value) {
    base64Text = base64Text + value.message.payload
})

//Base64を画像ファイルにでコード
//https://rakko.tools/tools/71/
