# =============================================================================
#  test_cancelshield.py — CancelShield Contract Integration Test Suite
# =============================================================================

import sys
import os
import json
import unittest
import py_compile
from unittest.mock import MagicMock

# ── Mocking structure to simulate the GenLayer SDK runtime ──────────────────
class MockContractBase:
    pass

class MockMessage:
    def __init__(self, sender="0x1111111111111111111111111111111111111111", value=0):
        self.sender_address = sender
        self.value = value

class MockWeb:
    def __init__(self):
        self.url_to_content = {}
    def render(self, url):
        if "404" in url:
            raise Exception("404 Link Blocked")
        if "empty" in url:
            return ""
        return self.url_to_content.get(url, "Influencer criticized for harmless joke about pineapple on pizza.")

class MockNondet:
    def __init__(self):
        self.web = MockWeb()
        self.exec_prompt_responses = []
        self.response_index = 0
        
    def exec_prompt(self, prompt):
        if self.response_index < len(self.exec_prompt_responses):
            res = self.exec_prompt_responses[self.response_index]
            self.response_index += 1
            return res
        return json.dumps({
            "claim_approved": True,
            "offense_severity": "TRIVIAL",
            "pr_analysis": "Pineapple pizza debate represents trivial online drama."
        })

class MockVM:
    def __init__(self, mock_nondet):
        self.mock_nondet = mock_nondet
    def run_nondet_unsafe(self, leader_fn, validator_fn):
        leader_res = leader_fn()
        consensus = validator_fn(leader_res)
        if consensus:
            return leader_res
        raise RuntimeError("Consensus not reached")

class MockGl:
    def __init__(self):
        self.message = MockMessage()
        self.nondet = MockNondet()
        self.vm = MockVM(self.nondet)
        self.Contract = MockContractBase
        self.public = self._create_public_decorator()

    def _create_public_decorator(self):
        class MockDecorator:
            def __call__(self, func):
                return func
            def __getattr__(self, name):
                return self
        class MockPublic:
            def __init__(self):
                self.view = MockDecorator()
                self.write = MockDecorator()
        return MockPublic()

    def get_contract_at(self, addr):
        mock_other = MagicMock()
        mock_other.emit_transfer = MagicMock()
        return mock_other

class MockTreeMap(dict):
    def get(self, key, default=None):
        return super().get(key, default)

# Inject mock genlayer sdk
mock_genlayer = MagicMock()
mock_genlayer.TreeMap = MockTreeMap
mock_genlayer.Address = str
mock_genlayer.u64 = int
mock_genlayer.u32 = int
mock_genlayer.u256 = int
mock_genlayer.i32 = int
mock_genlayer.gl = MockGl()
mock_genlayer.UserError = Exception

sys.modules['genlayer'] = mock_genlayer

# Adjust path to import the actual contract
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'contracts'))
from cancelshield import Contract

class TestCancelShield(unittest.TestCase):
    def setUp(self):
        self.contract = Contract()
        self.contract.policies_count = 0
        self.contract.total_reserved_coverage = 0
        
        # Simulate contract balance starts at 0
        self.contract.balance = 0
        
        for field, f_type in self.contract.__class__.__annotations__.items():
            if 'TreeMap' in str(f_type):
                setattr(self.contract, field, MockTreeMap())
                
        # Reset Mock SDK state
        mock_genlayer.gl.message = MockMessage()
        mock_genlayer.gl.nondet.exec_prompt_responses = []
        mock_genlayer.gl.nondet.response_index = 0

    def test_reproducible_compilation(self):
        # 1. Verify the contract compiles without any python syntax errors
        contract_path = os.path.join(os.path.dirname(__file__), '..', 'contracts', 'cancelshield.py')
        try:
            compiled_path = py_compile.compile(contract_path, doraise=True)
            self.assertTrue(os.path.exists(compiled_path))
        except py_compile.PyCompileError as e:
            self.fail(f"Contract compilation failed: {str(e)}")

    def test_deposit_capital(self):
        # 1. Deposit 100 GEN capital to underwrite policies
        mock_genlayer.gl.message.value = 100 * 10**18
        self.contract.balance = 100 * 10**18
        
        self.contract.deposit_capital()
        self.assertEqual(self.contract.balance, 100 * 10**18)

    def test_buy_policy_with_adequate_reserves(self):
        # 1. Underwriter funds the pool
        self.contract.balance = 100 * 10**18
        
        # 2. Buy policy with premium of 10 GEN (coverage is 50 GEN)
        mock_genlayer.gl.message.sender_address = "0x2222222222222222222222222222222222222222"
        mock_genlayer.gl.message.value = 10 * 10**18
        self.contract.balance += 10 * 10**18 # Deposit premium increases balance
        
        pid = self.contract.buy_policy()
        
        self.assertEqual(pid, 0)
        self.assertEqual(self.contract.policy_owner[pid], "0x2222222222222222222222222222222222222222")
        self.assertEqual(self.contract.policy_cover[pid], 50 * 10**18)
        self.assertEqual(self.contract.policy_status[pid], "ACTIVE")
        self.assertEqual(self.contract.total_reserved_coverage, 50 * 10**18)

    def test_buy_policy_insufficient_reserves_failure(self):
        # 1. No underwriter funds. Contract balance is 0.
        # 2. Buy policy with premium of 10 GEN (coverage is 50 GEN)
        mock_genlayer.gl.message.sender_address = "0x2222222222222222222222222222222222222222"
        mock_genlayer.gl.message.value = 10 * 10**18
        self.contract.balance = 10 * 10**18 # balance is only the premium (10 GEN)
        
        # 3. Reserve check should fail (reserved coverage 50 GEN > contract balance 10 GEN)
        with self.assertRaises(Exception) as context:
            self.contract.buy_policy()
            
        self.assertIn("Insufficient underwriter capital", str(context.exception))
        self.assertEqual(self.contract.total_reserved_coverage, 0)

    def test_approved_claim_releasing_reserves_and_payout(self):
        # 1. Fund and purchase policy
        self.contract.balance = 100 * 10**18
        mock_genlayer.gl.message.sender_address = "0x2222222222222222222222222222222222222222"
        mock_genlayer.gl.message.value = 10 * 10**18
        self.contract.balance += 10 * 10**18
        pid = self.contract.buy_policy()
        
        # 2. Mock external transfer
        mock_other = MagicMock()
        mock_genlayer.gl.get_contract_at = MagicMock(return_value=mock_other)
        
        # 3. AI consensus approves claim (cancellation is unjustified/trivial)
        leader_out = json.dumps({
            "claim_approved": True,
            "offense_severity": "TRIVIAL",
            "pr_analysis": "Harmless old jokes are trivial."
        })
        val_out = json.dumps({
            "claim_approved": True,
            "offense_severity": "TRIVIAL",
            "pr_analysis": "Harmless."
        })
        mock_genlayer.gl.nondet.exec_prompt_responses = [leader_out, val_out]
        
        # 4. File claim
        self.contract.file_claim(pid, "https://expose.com/influencer")
        
        # 5. Assert status, payout, and reserve release
        self.assertEqual(self.contract.policy_status[pid], "CLAIMED")
        self.assertEqual(self.contract.policy_cover[pid], 0)
        self.assertEqual(self.contract.total_reserved_coverage, 0)
        mock_genlayer.gl.get_contract_at.assert_called_with("0x2222222222222222222222222222222222222222")
        mock_other.emit_transfer.assert_called_with(value=50 * 10**18)

    def test_denied_claim_releasing_reserves(self):
        # 1. Fund and purchase policy
        self.contract.balance = 100 * 10**18
        mock_genlayer.gl.message.sender_address = "0x2222222222222222222222222222222222222222"
        mock_genlayer.gl.message.value = 10 * 10**18
        self.contract.balance += 10 * 10**18
        pid = self.contract.buy_policy()
        
        # 2. AI consensus denies claim (cancellation is justified due to critical violation)
        leader_out = json.dumps({
            "claim_approved": False,
            "offense_severity": "CRITICAL",
            "pr_analysis": "Documented financial fraud is justified grounds for cancellation."
        })
        val_out = json.dumps({
            "claim_approved": False,
            "offense_severity": "CRITICAL",
            "pr_analysis": "FRAUD."
        })
        mock_genlayer.gl.nondet.exec_prompt_responses = [leader_out, val_out]
        
        # 3. File claim
        self.contract.file_claim(pid, "https://news.com/fraud-exposed")
        
        # 4. Assert status and reserve release, no payout occurs
        self.assertEqual(self.contract.policy_status[pid], "DENIED")
        self.assertEqual(self.contract.total_reserved_coverage, 0)

    def test_claim_reverts_on_infrastructure_error_allowing_retry(self):
        # 1. Fund and purchase policy
        self.contract.balance = 100 * 10**18
        mock_genlayer.gl.message.sender_address = "0x2222222222222222222222222222222222222222"
        mock_genlayer.gl.message.value = 10 * 10**18
        self.contract.balance += 10 * 10**18
        pid = self.contract.buy_policy()
        
        # 2. File claim with offline/404 drama URL to trigger URL_FETCH_FAILED
        with self.assertRaises(Exception) as context:
            self.contract.file_claim(pid, "https://expose.com/404-report")
            
        self.assertIn("Claim audit failed: URL_FETCH_FAILED", str(context.exception))
        
        # 3. Verify policy is STILL ACTIVE (reverted state, making it retryable!)
        self.assertEqual(self.contract.policy_status[pid], "ACTIVE")
        self.assertEqual(self.contract.total_reserved_coverage, 50 * 10**18)

if __name__ == '__main__':
    unittest.main()
