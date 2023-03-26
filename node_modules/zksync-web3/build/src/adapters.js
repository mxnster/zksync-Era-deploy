"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterL2 = exports.AdapterL1 = void 0;
const ethers_1 = require("ethers");
const typechain_1 = require("../typechain");
const utils_1 = require("./utils");
function AdapterL1(Base) {
    return class Adapter extends Base {
        _providerL2() {
            throw new Error('Must be implemented by the derived class!');
        }
        _providerL1() {
            throw new Error('Must be implemented by the derived class!');
        }
        _signerL1() {
            throw new Error('Must be implemented by the derived class!');
        }
        async getMainContract() {
            const address = await this._providerL2().getMainContractAddress();
            return typechain_1.IZkSyncFactory.connect(address, this._signerL1());
        }
        async getL1BridgeContracts() {
            const addresses = await this._providerL2().getDefaultBridgeAddresses();
            return {
                erc20: typechain_1.IL1BridgeFactory.connect(addresses.erc20L1, this._signerL1())
            };
        }
        async getBalanceL1(token, blockTag) {
            token !== null && token !== void 0 ? token : (token = utils_1.ETH_ADDRESS);
            if ((0, utils_1.isETH)(token)) {
                return await this._providerL1().getBalance(await this.getAddress(), blockTag);
            }
            else {
                const erc20contract = typechain_1.IERC20MetadataFactory.connect(token, this._providerL1());
                return await erc20contract.balanceOf(await this.getAddress());
            }
        }
        async l2TokenAddress(token) {
            if (token == utils_1.ETH_ADDRESS) {
                return utils_1.ETH_ADDRESS;
            }
            else {
                const erc20Bridge = (await this.getL1BridgeContracts()).erc20;
                return await erc20Bridge.l2TokenAddress(token);
            }
        }
        async approveERC20(token, amount, overrides) {
            if ((0, utils_1.isETH)(token)) {
                throw new Error("ETH token can't be approved. The address of the token does not exist on L1.");
            }
            let bridgeAddress = overrides === null || overrides === void 0 ? void 0 : overrides.bridgeAddress;
            const erc20contract = typechain_1.IERC20MetadataFactory.connect(token, this._signerL1());
            if (bridgeAddress == null) {
                bridgeAddress = (await this._providerL2().getDefaultBridgeAddresses()).erc20L1;
            }
            else {
                delete overrides.bridgeAddress;
            }
            return await erc20contract.approve(bridgeAddress, amount, overrides);
        }
        async getBaseCost(params) {
            var _a, _b;
            const zksyncContract = await this.getMainContract();
            const parameters = { ...(0, utils_1.layer1TxDefaults)(), ...params };
            (_a = parameters.gasPrice) !== null && _a !== void 0 ? _a : (parameters.gasPrice = await this._providerL1().getGasPrice());
            (_b = parameters.gasPerPubdataByte) !== null && _b !== void 0 ? _b : (parameters.gasPerPubdataByte = utils_1.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
            return ethers_1.BigNumber.from(await zksyncContract.l2TransactionBaseCost(parameters.gasPrice, parameters.gasLimit, parameters.gasPerPubdataByte));
        }
        async deposit(transaction) {
            var _a;
            const depositTx = await this.getDepositTx(transaction);
            if (transaction.token == utils_1.ETH_ADDRESS) {
                return this.requestExecute(depositTx);
            }
            else {
                const bridgeContracts = await this.getL1BridgeContracts();
                if (transaction.approveERC20) {
                    const approveTx = await this.approveERC20(transaction.token, transaction.amount, {
                        bridgeAddress: (_a = transaction.bridgeAddress) !== null && _a !== void 0 ? _a : bridgeContracts.erc20.address,
                        ...transaction.approveOverrides
                    });
                    await approveTx.wait();
                }
                return await this._providerL2().getPriorityOpResponse(await this._signerL1().sendTransaction(depositTx));
            }
        }
        async estimateGasDeposit(transaction) {
            const depositTx = await this.getDepositTx(transaction);
            if (transaction.token == utils_1.ETH_ADDRESS) {
                return await this.estimateGasRequestExecute(depositTx);
            }
            else {
                return await this._providerL1().estimateGas(depositTx);
            }
        }
        async getDepositTx(transaction) {
            var _a, _b, _c, _d, _e, _f, _g;
            const bridgeContracts = await this.getL1BridgeContracts();
            if (transaction.bridgeAddress) {
                bridgeContracts.erc20.attach(transaction.bridgeAddress);
            }
            const { ...tx } = transaction;
            (_a = tx.to) !== null && _a !== void 0 ? _a : (tx.to = await this.getAddress());
            (_b = tx.operatorTip) !== null && _b !== void 0 ? _b : (tx.operatorTip = ethers_1.BigNumber.from(0));
            (_c = tx.overrides) !== null && _c !== void 0 ? _c : (tx.overrides = {});
            (_d = tx.gasPerPubdataByte) !== null && _d !== void 0 ? _d : (tx.gasPerPubdataByte = utils_1.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
            (_e = tx.l2GasLimit) !== null && _e !== void 0 ? _e : (tx.l2GasLimit = await (0, utils_1.estimateDefaultBridgeDepositL2Gas)(this._providerL1(), this._providerL2(), tx.token, tx.amount, tx.to, await this.getAddress(), tx.gasPerPubdataByte));
            const { to, token, amount, operatorTip, overrides } = tx;
            await insertGasPrice(this._providerL1(), overrides);
            const gasPriceForEstimation = overrides.maxFeePerGas || overrides.gasPrice;
            const zksyncContract = await this.getMainContract();
            const baseCost = await zksyncContract.l2TransactionBaseCost(await gasPriceForEstimation, tx.l2GasLimit, tx.gasPerPubdataByte);
            if (token == utils_1.ETH_ADDRESS) {
                (_f = overrides.value) !== null && _f !== void 0 ? _f : (overrides.value = baseCost.add(operatorTip).add(amount));
                return {
                    contractAddress: to,
                    calldata: '0x',
                    l2Value: amount,
                    // For some reason typescript can not deduce that we've already set the
                    // tx.l2GasLimit
                    l2GasLimit: tx.l2GasLimit,
                    ...tx
                };
            }
            else {
                const args = [
                    to,
                    token,
                    amount,
                    tx.l2GasLimit,
                    tx.gasPerPubdataByte
                ];
                (_g = overrides.value) !== null && _g !== void 0 ? _g : (overrides.value = baseCost.add(operatorTip));
                await (0, utils_1.checkBaseCost)(baseCost, overrides.value);
                // TODO: compatibility layer: using the old API which uses msg.sender as the
                // refund recipient, to make the SDK compatible with the old contracts.
                // const contract = bridgeContracts.erc20 as ethers.Contract;
                return await bridgeContracts.erc20.populateTransaction.deposit(...args, overrides);
            }
        }
        async _getWithdrawalLog(withdrawalHash, index = 0) {
            const hash = ethers_1.ethers.utils.hexlify(withdrawalHash);
            const receipt = await this._providerL2().getTransactionReceipt(hash);
            const log = receipt.logs.filter((log) => log.address == utils_1.L1_MESSENGER_ADDRESS &&
                log.topics[0] == ethers_1.ethers.utils.id('L1MessageSent(address,bytes32,bytes)'))[index];
            return {
                log,
                l1BatchTxId: receipt.l1BatchTxIndex
            };
        }
        async _getWithdrawalL2ToL1Log(withdrawalHash, index = 0) {
            const hash = ethers_1.ethers.utils.hexlify(withdrawalHash);
            const receipt = await this._providerL2().getTransactionReceipt(hash);
            const messages = Array.from(receipt.l2ToL1Logs.entries()).filter(([_, log]) => log.sender == utils_1.L1_MESSENGER_ADDRESS);
            const [l2ToL1LogIndex, l2ToL1Log] = messages[index];
            return {
                l2ToL1LogIndex,
                l2ToL1Log
            };
        }
        async finalizeWithdrawalParams(withdrawalHash, index = 0) {
            const { log, l1BatchTxId } = await this._getWithdrawalLog(withdrawalHash, index);
            const { l2ToL1LogIndex } = await this._getWithdrawalL2ToL1Log(withdrawalHash, index);
            const sender = ethers_1.ethers.utils.hexDataSlice(log.topics[1], 12);
            const proof = await this._providerL2().getLogProof(withdrawalHash, l2ToL1LogIndex);
            const message = ethers_1.ethers.utils.defaultAbiCoder.decode(['bytes'], log.data)[0];
            return {
                l1BatchNumber: log.l1BatchNumber,
                l2MessageIndex: proof.id,
                l2TxNumberInBlock: l1BatchTxId,
                message,
                sender,
                proof: proof.proof
            };
        }
        async finalizeWithdrawal(withdrawalHash, index = 0, overrides) {
            const { l1BatchNumber, l2MessageIndex, l2TxNumberInBlock, message, sender, proof } = await this.finalizeWithdrawalParams(withdrawalHash, index);
            if ((0, utils_1.isETH)(sender)) {
                const contractAddress = await this._providerL2().getMainContractAddress();
                const zksync = typechain_1.IZkSyncFactory.connect(contractAddress, this._signerL1());
                return await zksync.finalizeEthWithdrawal(l1BatchNumber, l2MessageIndex, l2TxNumberInBlock, message, proof, overrides !== null && overrides !== void 0 ? overrides : {});
            }
            const l2Bridge = typechain_1.IL2BridgeFactory.connect(sender, this._providerL2());
            const l1Bridge = typechain_1.IL1BridgeFactory.connect(await l2Bridge.l1Bridge(), this._signerL1());
            return await l1Bridge.finalizeWithdrawal(l1BatchNumber, l2MessageIndex, l2TxNumberInBlock, message, proof, overrides !== null && overrides !== void 0 ? overrides : {});
        }
        async isWithdrawalFinalized(withdrawalHash, index = 0) {
            const { log } = await this._getWithdrawalLog(withdrawalHash, index);
            const { l2ToL1LogIndex } = await this._getWithdrawalL2ToL1Log(withdrawalHash, index);
            const sender = ethers_1.ethers.utils.hexDataSlice(log.topics[1], 12);
            // `getLogProof` is called not to get proof but
            // to get the index of the corresponding L2->L1 log,
            // which is returned as `proof.id`.
            const proof = await this._providerL2().getLogProof(withdrawalHash, l2ToL1LogIndex);
            if ((0, utils_1.isETH)(sender)) {
                const contractAddress = await this._providerL2().getMainContractAddress();
                const zksync = typechain_1.IZkSyncFactory.connect(contractAddress, this._signerL1());
                return await zksync.isEthWithdrawalFinalized(log.l1BatchNumber, proof.id);
            }
            const l2Bridge = typechain_1.IL2BridgeFactory.connect(sender, this._providerL2());
            const l1Bridge = typechain_1.IL1BridgeFactory.connect(await l2Bridge.l1Bridge(), this._providerL1());
            return await l1Bridge.isWithdrawalFinalized(log.l1BatchNumber, proof.id);
        }
        async claimFailedDeposit(depositHash, overrides) {
            const receipt = await this._providerL2().getTransactionReceipt(ethers_1.ethers.utils.hexlify(depositHash));
            const successL2ToL1LogIndex = receipt.l2ToL1Logs.findIndex((l2ToL1log) => l2ToL1log.sender == utils_1.BOOTLOADER_FORMAL_ADDRESS && l2ToL1log.key == depositHash);
            const successL2ToL1Log = receipt.l2ToL1Logs[successL2ToL1LogIndex];
            if (successL2ToL1Log.value != ethers_1.ethers.constants.HashZero) {
                throw new Error('Cannot claim successful deposit');
            }
            const tx = await this._providerL2().getTransaction(ethers_1.ethers.utils.hexlify(depositHash));
            // Undo the aliasing, since the Mailbox contract set it as for contract address.
            const l1BridgeAddress = (0, utils_1.undoL1ToL2Alias)(receipt.from);
            const l2BridgeAddress = receipt.to;
            const l1Bridge = typechain_1.IL1BridgeFactory.connect(l1BridgeAddress, this._signerL1());
            const l2Bridge = typechain_1.IL2BridgeFactory.connect(l2BridgeAddress, this._providerL2());
            const calldata = l2Bridge.interface.decodeFunctionData('finalizeDeposit', tx.data);
            const proof = await this._providerL2().getLogProof(depositHash, successL2ToL1LogIndex);
            return await l1Bridge.claimFailedDeposit(calldata['_l1Sender'], calldata['_l1Token'], depositHash, receipt.l1BatchNumber, proof.id, receipt.l1BatchTxIndex, proof.proof, overrides !== null && overrides !== void 0 ? overrides : {});
        }
        async requestExecute(transaction) {
            const requestExecuteTx = await this.getRequestExecuteTx(transaction);
            return this._providerL2().getPriorityOpResponse(await this._signerL1().sendTransaction(requestExecuteTx));
        }
        async estimateGasRequestExecute(transaction) {
            const requestExecuteTx = await this.getRequestExecuteTx(transaction);
            return this._providerL1().estimateGas(requestExecuteTx);
        }
        async getRequestExecuteTx(transaction) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const zksyncContract = await this.getMainContract();
            const { ...tx } = transaction;
            (_a = tx.l2Value) !== null && _a !== void 0 ? _a : (tx.l2Value = ethers_1.BigNumber.from(0));
            (_b = tx.operatorTip) !== null && _b !== void 0 ? _b : (tx.operatorTip = ethers_1.BigNumber.from(0));
            (_c = tx.factoryDeps) !== null && _c !== void 0 ? _c : (tx.factoryDeps = []);
            (_d = tx.overrides) !== null && _d !== void 0 ? _d : (tx.overrides = {});
            (_e = tx.gasPerPubdataByte) !== null && _e !== void 0 ? _e : (tx.gasPerPubdataByte = utils_1.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
            (_f = tx.refundRecipient) !== null && _f !== void 0 ? _f : (tx.refundRecipient = await this.getAddress());
            (_g = tx.l2GasLimit) !== null && _g !== void 0 ? _g : (tx.l2GasLimit = await this._providerL2().estimateL1ToL2Execute(transaction));
            const { contractAddress, l2Value, calldata, l2GasLimit, factoryDeps, operatorTip, overrides, gasPerPubdataByte, refundRecipient } = tx;
            await insertGasPrice(this._providerL1(), overrides);
            const gasPriceForEstimation = overrides.maxFeePerGas || overrides.gasPrice;
            const baseCost = await this.getBaseCost({
                gasPrice: await gasPriceForEstimation,
                gasPerPubdataByte,
                gasLimit: l2GasLimit
            });
            (_h = overrides.value) !== null && _h !== void 0 ? _h : (overrides.value = baseCost.add(operatorTip).add(l2Value));
            await (0, utils_1.checkBaseCost)(baseCost, overrides.value);
            return await zksyncContract.populateTransaction.requestL2Transaction(contractAddress, l2Value, calldata, l2GasLimit, utils_1.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT, factoryDeps, refundRecipient, overrides);
        }
    };
}
exports.AdapterL1 = AdapterL1;
function AdapterL2(Base) {
    return class Adapter extends Base {
        _providerL2() {
            throw new Error('Must be implemented by the derived class!');
        }
        _signerL2() {
            throw new Error('Must be implemented by the derived class!');
        }
        async getBalance(token, blockTag = 'committed') {
            return await this._providerL2().getBalance(await this.getAddress(), blockTag, token);
        }
        async getAllBalances() {
            return await this._providerL2().getAllAccountBalances(await this.getAddress());
        }
        async getL2BridgeContracts() {
            const addresses = await this._providerL2().getDefaultBridgeAddresses();
            return {
                erc20: typechain_1.IL2BridgeFactory.connect(addresses.erc20L2, this._signerL2())
            };
        }
        _fillCustomData(data) {
            var _a, _b;
            const customData = { ...data };
            (_a = customData.gasPerPubdata) !== null && _a !== void 0 ? _a : (customData.gasPerPubdata = utils_1.DEFAULT_GAS_PER_PUBDATA_LIMIT);
            (_b = customData.factoryDeps) !== null && _b !== void 0 ? _b : (customData.factoryDeps = []);
            return customData;
        }
        async withdraw(transaction) {
            const withdrawTx = await this._providerL2().getWithdrawTx({
                from: await this.getAddress(),
                ...transaction
            });
            const txResponse = await this.sendTransaction(withdrawTx);
            return this._providerL2()._wrapTransaction(txResponse);
        }
        async transfer(transaction) {
            const transferTx = await this._providerL2().getTransferTx({
                from: await this.getAddress(),
                ...transaction
            });
            const txResponse = await this.sendTransaction(transferTx);
            return this._providerL2()._wrapTransaction(txResponse);
        }
    };
}
exports.AdapterL2 = AdapterL2;
/// @dev This method checks if the overrides contain a gasPrice (or maxFeePerGas), if not it will insert
/// the maxFeePerGas
async function insertGasPrice(l1Provider, overrides) {
    if (!overrides.gasPrice && !overrides.maxFeePerGas) {
        const l1FeeData = await l1Provider.getFeeData();
        // Sometimes baseFeePerGas is not available, so we use gasPrice instead.
        const baseFee = l1FeeData.lastBaseFeePerGas || l1FeeData.gasPrice;
        // ethers.js by default uses multiplcation by 2, but since the price for the L2 part
        // will depend on the L1 part, doubling base fee is typically too much.
        const maxFeePerGas = baseFee.mul(3).div(2).add(l1FeeData.maxPriorityFeePerGas);
        overrides.maxFeePerGas = maxFeePerGas;
        overrides.maxPriorityFeePerGas = l1FeeData.maxPriorityFeePerGas;
    }
}
