import { run } from "hardhat";

export async function verify({
  contractAddress,
  args,
  contract,
}: ContractInput) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contract,
    });
  } catch (e) {
    if ((e as Error).message.toLowerCase().includes("already verified")) {
      console.log("ERROR");
      console.log("Already verified!");
    } else {
      console.log("ERROR");
      console.log(e);
    }
  }
}

interface ContractInput {
  contractAddress: string;
  args?: any;
  contract?: string;
}
