export class Wallet {
  readonly id!: string;
  readonly name!: string;
  readonly balance!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export class BalanceResponse {
  readonly totalBalance!: string;
}
