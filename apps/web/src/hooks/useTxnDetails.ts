import { BigNumber as EthBigNumber, ethers } from "ethers";
import BigNumber from "bignumber.js";
import { ContractType } from "@components/erc-transfer/QueryTransactionModal";

export default async function useTxnDetails(
  bridgeIface: ethers.utils.Interface,
  EthereumRpcUrl: string,
  transactionInput?: string
) {
  const provider = new ethers.providers.JsonRpcProvider(EthereumRpcUrl);
  try {
    //0xeb2a9431faf5559aa9bee0d639a131b6ddec2cdc5d4fe7534db1d9a149d5a1a3
    const receipt = await provider.getTransaction(
      "0xeb2a9431faf5559aa9bee0d639a131b6ddec2cdc5d4fe7534db1d9a149d5a1a3"
    );
    const decodedData = bridgeIface.parseTransaction({
      data: receipt.data,
    });
    const { params } = decodeTxnData({ bridgeIface, decodedData });
    const {
      _defiAddress: defiAddress,
      _tokenAddress: tokenAddress,
      _amount: amount,
    } = params;
    const toAddress = ethers.utils.toUtf8String(defiAddress);
    let transferAmount;
    // eth transfer
    if (tokenAddress === ethers.constants.AddressZero) {
      const ethAmount = EthBigNumber.from(receipt.value).toString();
      transferAmount = new BigNumber(ethAmount).dividedBy(
        new BigNumber(10).pow(18)
      );
    }
    // wToken transfer
    // const evmTokenContract = new ethers.Contract(
    //   tokenAddress,
    //   ERC20__factory.abi,
    //   this.ethersRpcProvider
    // );
    // const wTokenSymbol = await evmTokenContract.symbol();
    // const wTokenDecimals = await evmTokenContract.decimals();
    // const transferAmount = new BigNumber(amount).dividedBy(
    //   new BigNumber(10).pow(wTokenDecimals)
    // );

    let formattedNumber = new BigNumber(transferAmount).toFormat(8);

    return { toAddress, formattedNumber };
  } catch (err) {
    console.log(err);
    console.log("error");
  }
}

const decodeTxnData = ({
  bridgeIface,
  decodedData,
}: {
  bridgeIface: ethers.utils.Interface;
  decodedData: ethers.utils.TransactionDescription;
}) => {
  const fragment = bridgeIface.getFunction(decodedData.name);
  const params = decodedData.args.reduce((res, param, i) => {
    let parsedParam = param;
    const isUint = fragment.inputs[i].type.indexOf("uint") === 0;
    const isInt = fragment.inputs[i].type.indexOf("int") === 0;
    const isAddress = fragment.inputs[i].type.indexOf("address") === 0;

    if (isUint || isInt) {
      const isArray = Array.isArray(param);

      if (isArray) {
        parsedParam = param.map((val) => EthBigNumber.from(val).toString());
      } else {
        parsedParam = EthBigNumber.from(param).toString();
      }
    }

    // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
    if (isAddress) {
      const isArray = Array.isArray(param);
      if (isArray) {
        parsedParam = param.map((_) => _.toLowerCase());
      } else {
        parsedParam = param.toLowerCase();
      }
    }
    return {
      ...res,
      [fragment.inputs[i].name]: parsedParam,
    };
  }, {});

  return {
    params,
    name: decodedData.name,
  };
};
