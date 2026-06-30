import { prisma } from "../../lib/db";
export async function handleSaveReceiptScan(
  payload: any,
  user: any,
  member: any,
  householdId: string | undefined,
) {
  if (!householdId) throw new Error("No household linked");
  const receipt = payload.receipt;
  const products = Array.isArray(payload.products) ? payload.products : [];
  const transaction = payload.transaction;

  await prisma.receiptScan.upsert({
    where: { id: receipt.id },
    update: {
      storeName: receipt.storeName,
      purchasedAt: receipt.purchasedAt,
      currency: receipt.currency,
      totalUsd: Number(receipt.totalUsd) || 0,
      items: receipt.items || [],
      rawText: receipt.rawText || null,
    },
    create: {
      id: receipt.id,
      householdId,
      storeName: receipt.storeName,
      purchasedAt: receipt.purchasedAt,
      currency: receipt.currency,
      totalUsd: Number(receipt.totalUsd) || 0,
      items: receipt.items || [],
      rawText: receipt.rawText || null,
    },
  });

  if (products.length > 0) {
    await prisma.trackedProduct.createMany({
      data: products.map((product: any) => ({
        id: product.id,
        householdId,
        name: product.name,
        store: product.store,
        category: product.category,
        amountUsd: Number(product.amountUsd) || 0,
        quantity: Number(product.quantity) || 1,
        unitPriceUsd: product.unitPriceUsd == null ? null : Number(product.unitPriceUsd),
        purchasedAt: product.purchasedAt,
        source: product.source === "receipt" ? "receipt" : "manual",
      })),
      skipDuplicates: true,
    });
  }

  if (transaction) {
    const wallet = await prisma.walletAccount.findFirst({
      where: { householdId, label: transaction.wallet },
    });
    if (wallet) {
      await prisma.transaction.createMany({
        data: [
          {
            id: transaction.id,
            householdId,
            name: transaction.name,
            who: transaction.who,
            usd: Number(transaction.usd) || 0,
            category: transaction.category,
            wallet: transaction.wallet,
            date: transaction.date,
          },
        ],
        skipDuplicates: true,
      });
    }
  }
}
