import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { OrderStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  ShellBridgeV1__factory,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { PrismaService } from '../../src/PrismaService';
import { StartedDeFiChainStubContainer } from '../defichain/containers/DeFiChainStubContainer';
import { BridgeContractFixture } from '../testing/BridgeContractFixture';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

let startedPostgresContainer: StartedPostgreSqlContainer;
let testing: BridgeServerTestingApp;

describe('Request Refund Testing', () => {
  let prismaService: PrismaService;
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;
  let validTxnHash: string;
  let validTxnHashNotInDB: string;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      5,
    );
    validTxnHash = transactionCall.hash;

    const transactionCallNotInDB = await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      5,
    );

    validTxnHashNotInDB = transactionCallNotInDB.hash;

    const dynamicModule = TestingModule.register(
      buildTestConfig({
        defichain: { key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
        startedHardhatContainer,
        testnet: { bridgeContractAddress: bridgeContract.address },
        startedPostgresContainer,
        usdcAddress: musdcContract.address,
      }),
    );

    testing = new BridgeServerTestingApp(dynamicModule);
    const app = await testing.start();
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.ethereumOrders.deleteMany({});
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should not be able to update order status to REFUND_REQUESTED when transaction did not complete 65 confirmations', async () => {
    await prismaService.ethereumOrders.create({
      data: {
        transactionHash: validTxnHash,
        ethereumStatus: 'NOT_CONFIRMED',
        status: 'DRAFT',
        createdAt: '2023-04-20T06:14:43.847Z',
        updatedAt: '2023-04-20T06:28:17.185Z',
        amount: null,
        tokenSymbol: null,
        defichainAddress: '',
        expiryDate: '1970-01-01T00:00:00.000Z',
      },
    });

    // Check that order details exists in the database
    const dbRecord = await prismaService.ethereumOrders.findFirst({
      where: { transactionHash: validTxnHash },
    });

    expect(dbRecord?.transactionHash).toStrictEqual(validTxnHash);

    await hardhatNetwork.generate(1);

    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.error).toEqual(
      'API call for refund was unsuccessful: Transaction has not been processed, did not complete 65 confirmations for EVM unable to proceed with refund request',
    );
  });

  it('Should check that transaction comes from quantum deployed smart contract', async () => {
    // Given any random arbitrary EOA
    const signer = ethers.Wallet.createRandom().connect(hardhatNetwork.ethersRpcProvider);
    await hardhatNetwork.activateAccount(signer.address);
    await hardhatNetwork.generate(1);

    // Fund arbitrary EOA to allow it to make transactions. It has no other funds
    await hardhatNetwork.fundAddress(signer.address, ethers.utils.parseEther('1000'));
    await hardhatNetwork.generate(1);

    // Deploy shell contract
    const ShellContractDeployment = await new ShellBridgeV1__factory(signer).deploy();
    await hardhatNetwork.generate(1);
    const shellContract = await ShellContractDeployment.deployed();

    // Create shell transaction
    const address = 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g';
    const tx = await shellContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes(address),
      musdcContract.address,
      new BigNumber(1).multipliedBy(new BigNumber(10).pow(18)).toFixed(0),
    );
    await hardhatNetwork.generate(100);
    const vulnerableTxHash = (await tx.wait(100)).transactionHash;

    await prismaService.ethereumOrders.create({
      data: {
        transactionHash: vulnerableTxHash,
        ethereumStatus: 'NOT_CONFIRMED',
        status: 'IN_PROGRESS',
        createdAt: '2023-04-20T06:14:43.847Z',
        updatedAt: '2023-04-20T06:28:17.185Z',
        amount: null,
        tokenSymbol: null,
        defichainAddress: '',
        expiryDate: '1970-01-01T00:00:00.000Z',
      },
    });

    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${vulnerableTxHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.error).toEqual('API call for refund was unsuccessful: Invalid transaction hash');
  });

  it('Should not be able to update order status to REFUND_REQUESTED status when status is in DRAFT', async () => {
    await hardhatNetwork.generate(65);
    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.error).toEqual('API call for refund was unsuccessful: Order cannot be refunded');
  });

  it('Should not be able to update order status to REFUND_REQUESTED when status is in COMPLETED', async () => {
    await prismaService.ethereumOrders.update({
      where: { transactionHash: validTxnHash },
      data: { status: OrderStatus.COMPLETED },
    });

    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.error).toEqual('API call for refund was unsuccessful: Order cannot be refunded');
  });

  it('Should not be able to update order status to REFUND_REQUESTED when status is in REFUNDED', async () => {
    await prismaService.ethereumOrders.update({
      where: { transactionHash: validTxnHash },
      data: { status: OrderStatus.REFUNDED },
    });

    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.error).toEqual('API call for refund was unsuccessful: Order cannot be refunded');
  });

  it('Should be able to update order status to REFUND_REQUESTED when status is not in DRAFT, COMPLETED and REFUNDED', async () => {
    await prismaService.ethereumOrders.update({
      where: { transactionHash: validTxnHash },
      data: { status: OrderStatus.IN_PROGRESS },
    });

    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    const order = JSON.parse(resp.body);
    expect(order.id).toEqual('1');
    expect(order.transactionHash).toEqual(validTxnHash);
    expect(order.status).toEqual(OrderStatus.REFUND_REQUESTED);
  });

  it('Should have `Order not found` error when transaction exist but order does not exist in DB', async () => {
    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/${validTxnHashNotInDB}/refund`,
    });

    expect(resp.statusCode).toEqual(500);
    expect(JSON.parse(resp.body).error).toEqual('API call for refund was unsuccessful: Order not found');
  });

  it("Should have `Cannot read properties of null (reading 'data')` error when transaction does not exist", async () => {
    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3835/refund`,
    });

    expect(resp.statusCode).toEqual(500);
    expect(JSON.parse(resp.body).error).toEqual(
      "API call for refund was unsuccessful: Cannot read properties of null (reading 'data')",
    );
  });

  it('Should have `Invalid Ethereum transaction hash: 1234` message transactionHash is invalid', async () => {
    const resp = await testing.inject({
      method: 'POST',
      url: `/ethereum/order/1234/refund`,
    });

    expect(JSON.parse(resp.body).message).toEqual('Invalid Ethereum transaction hash: 1234');
  });
});
