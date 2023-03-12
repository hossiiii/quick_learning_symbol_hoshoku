```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);

bob = sym.Account.generateNewAccount(networkType);

key = sym.KeyGenerator.generateUInt64Key("key_account");
value = "test";

tx1 = await metaService.createAccountMetadataTransaction(
    undefined,
    networkType,
    alice.address, //メタデータ記録先アドレス
    key,value, //Key-Value値
    alice.address //メタデータ作成者アドレス
).toPromise();

tx2 = await metaService.createAccountMetadataTransaction(
    undefined,
    networkType,
    bob.address, //メタデータ記録先アドレス
    key,value, //Key-Value値
    alice.address //メタデータ作成者アドレス
).toPromise();

tx3 = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    alice.address,
    [],
    sym.PlainMessage.create(`hello symbol`),
    networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
  tx3.toAggregate(alice.publicAccount),
  tx1.toAggregate(alice.publicAccount),
  tx2.toAggregate(alice.publicAccount),
  ],
  networkType,[]
).setMaxFeeForAggregate(100, 1); // 第二引数に連署者の数:1

signedTx = aggregateTx.signTransactionWithCosignatories(
  alice,[bob],generationHash,// 第二引数に連署者
);
await txRepo.announce(signedTx).toPromise();

transactionStatusUrl = NODE + "/transactionStatus/" + signedTx.hash

console.log("signedTx.payload");
console.log(signedTx.payload);

console.log(transactionStatusUrl);
`https://testnet.symbol.fyi/transactions/${signedTx.hash}` //以下リンクをクリック



//途中でモザイクを作成し、メタデータを付与する必要がある
5章、7章


```
