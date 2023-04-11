import { DeFiChainAddressIndex } from '@prisma/client';

export type Iso8601DateOnlyString = `${number}-${number}-${number}`;
// Need to turn id field into string to prevent it from being undefined when fetching results from the server
export type ModifyDeFiChainAddressIndex = Omit<DeFiChainAddressIndex, 'id'> & {
  id: string;
};
