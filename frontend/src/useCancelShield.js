import { useState, useCallback, useEffect } from 'react';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let _readClient = null;

function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet });
  }
  return _readClient;
}

function getWriteClient(account) {
  if (typeof account === 'string') {
    return createClient({
      chain: studionet,
      account,
      provider: window.ethereum,
    });
  }
  return createClient({ chain: studionet, account });
}

// Convert Wei (u256) to human readable GEN string
export function formatGen(weiVal) {
  if (!weiVal) return '0';
  try {
    const big = BigInt(weiVal);
    const integerPart = big / 10n**18n;
    const fractionalPart = big % 10n**18n;
    let fractionStr = fractionalPart.toString().padStart(18, '0');
    fractionStr = fractionStr.replace(/0+$/, ''); // Trim trailing zeros
    if (fractionStr === '') {
      return integerPart.toString();
    }
    return `${integerPart}.${fractionStr.slice(0, 4)}`;
  } catch (e) {
    return '0';
  }
}

// Convert human readable GEN input to Wei (u256 BigInt)
export function parseGen(genVal) {
  if (!genVal || genVal.toString().trim() === '') return 0n;
  try {
    const parts = genVal.toString().split('.');
    let integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '';
    fractionalPart = fractionalPart.slice(0, 18).padEnd(18, '0');
    return BigInt(integerPart) * 10n**18n + BigInt(fractionalPart);
  } catch (e) {
    return 0n;
  }
}

export function useCancelShield() {
  const [address, setAddress] = useState('');
  const [glAccount, setGlAccount] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Connect Wallet (MetaMask or fallback ephemeral account)
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const addr = accounts[0].toLowerCase();
          
          // Test snap connection. If it fails, fallback to Demo Wallet.
          const client = getWriteClient(addr);
          await client.connect();

          setAddress(addr);
          setGlAccount(addr);
          return; // Success
        } catch (walletErr) {
          console.warn('MetaMask Snap not supported or connection failed, using Demo Wallet:', walletErr);
        }
      }

      // Ephemeral account fallback
      let savedKey = localStorage.getItem('__cancelshield_sk');
      let acct;
      if (savedKey) {
        acct = createAccount(savedKey);
      } else {
        acct = createAccount();
        localStorage.setItem('__cancelshield_sk', acct.privateKey);
      }
      const addr = acct.address.toLowerCase();
      setAddress(addr);
      setGlAccount(acct);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Wallet connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all policies and contract balance
  const fetchPoliciesState = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
      const client = getReadClient();
      
      // Get the number of policies
      const rawCount = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_policy_count',
        args: [],
      });
      const count = Number(rawCount);
      
      const fetchedPolicies = [];
      for (let i = 0; i < count; i++) {
        const rawPolicy = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: 'get_policy',
          args: [i],
        });
        const policyObj = JSON.parse(rawPolicy);
        fetchedPolicies.push(policyObj);
      }
      
      // Get balance of contract (insurance pool balance)
      const rawBalance = await client.getBalance({ address: CONTRACT_ADDRESS });
      setContractBalance(rawBalance.toString());
      
      setPolicies(fetchedPolicies.reverse()); // Show newest first
      setError('');
    } catch (err) {
      console.error('Error fetching policies:', err);
      setError('Failed to fetch policies: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buy Policy (Premium deposit)
  const buyPolicy = async (premiumAmt) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Purchasing active insurance policy with premium ${premiumAmt} GEN...`);

    try {
      const client = getWriteClient(glAccount);
      const valueWei = parseGen(premiumAmt);
      
      if (typeof glAccount === 'string') {
        await client.connect();
      }

      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'buy_policy',
        args: [],
        value: valueWei,
      });
      
      setTxHash(hash);
      setTxStatus('Buying policy. Locking premium into insurance pool...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Success! Insurance policy successfully activated.');
      await fetchPoliciesState();
      return receipt;
    } catch (err) {
      console.error('Policy purchase failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // File Claim (AI PR audit on drama url)
  const fileClaim = async (policyId, dramaUrl) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus('Submitting drama URL for AI PR Crisis Analyst review...');

    try {
      const client = getWriteClient(glAccount);
      
      if (typeof glAccount === 'string') {
        await client.connect();
      }

      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'file_claim',
        args: [Number(policyId), dramaUrl.trim()],
      });
      
      setTxHash(hash);
      setTxStatus('Validators are analyzing cancel drama text, checking context, and validating claims. This takes 15-30s...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Audit evaluation error';
        throw new Error(errorMsg);
      }

      setTxStatus('Crisis assessment complete! consensus on drama severity reached.');
      await fetchPoliciesState();
      return receipt;
    } catch (err) {
      console.error('Claim filing failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Deposit Capital to pool
  const depositCapital = async (amountGen) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Depositing ${amountGen} GEN underwriter capital into pool...`);

    try {
      const client = getWriteClient(glAccount);
      const valueWei = parseGen(amountGen);
      
      if (typeof glAccount === 'string') {
        await client.connect();
      }

      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'deposit_capital',
        args: [],
        value: valueWei,
      });
      
      setTxHash(hash);
      setTxStatus('Depositing capital. Broadcasting reserve backing...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Success! Pool reserves increased.');
      await fetchPoliciesState();
      return receipt;
    } catch (err) {
      console.error('Capital deposit failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (CONTRACT_ADDRESS) {
      fetchPoliciesState();
    }
  }, [CONTRACT_ADDRESS, address, fetchPoliciesState]);

  return {
    address,
    policies,
    contractBalance,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    fetchPoliciesState,
    buyPolicy,
    fileClaim,
    depositCapital,
    contractAddress: CONTRACT_ADDRESS,
  };
}
