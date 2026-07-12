# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# =============================================================================
#  cancelshield.py — Decentralized Cancel Culture Insurance Protocol
#  GenLayer Intelligent Contract (v0.2.16)
# =============================================================================

from genlayer import *
import json

class Contract(gl.Contract):
    """
    CancelShield — Dynamic influencer income insurance protocol
    ============================================================
    Locks premiums in escrow. Evaluates cancel drama reports using AI to
    differentiate coordinated cyberbullying from severe moral/legal failures.
    Releases payouts automatically if cancellations are ruled unfair.
    """

    # Monotonic policy counter
    policies_count:           u64

    # State mappings (using sized integer type arguments in TreeMap generics)
    policy_owner:             TreeMap[u64, Address]
    policy_premium:           TreeMap[u64, u256]
    policy_cover:             TreeMap[u64, u256]      # 5x premium coverage
    policy_status:            TreeMap[u64, str]      # "ACTIVE", "CLAIMED", "DENIED"
    policy_drama_url:         TreeMap[u64, str]
    policy_analysis:          TreeMap[u64, str]      # AI PR Analyst review
    policy_severity:          TreeMap[u64, str]      # "CRITICAL", "TRIVIAL", "NONE"

    # Track total capital reserved to pay out active policies
    total_reserved_coverage:  u256

    # ═══════════════════════════════════════════════════════════════════
    # CONSTRUCTOR
    # ═══════════════════════════════════════════════════════════════════
    def __init__(self) -> None:
        """
        Constructor. Standard GenLayer initialization.
        Note: TreeMaps are pre-initialized by the VM and must not be assigned here.
        """
        self.policies_count = 0
        self.total_reserved_coverage = 0

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC METHOD: PROVIDE LIQUIDITY / CAPITAL TO THE PROTOCOL
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write.payable
    def deposit_capital(self) -> None:
        """
        Allows underwriters or liquidity providers to deposit native GEN tokens
        to back the insurance pool reserves.
        """
        if int(gl.message.value) <= 0:
            raise UserError("Deposit amount must be positive.")

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC METHOD: BUY INSURANCE POLICY
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write.payable
    def buy_policy(self) -> int:
        """
        Creators call this to purchase an active cancel insurance policy
        by depositing native GEN tokens. Payout coverage is set at 5x premium.
        """
        premium_val = int(gl.message.value)
        if premium_val <= 0:
            raise UserError("You must deposit a positive GEN premium amount.")

        coverage_val = premium_val * 5

        # Reserve check: contract must have enough total balance to back all active promised coverage
        new_reserved = int(self.total_reserved_coverage) + coverage_val
        if int(self.balance) < new_reserved:
            raise UserError("Insufficient underwriter capital in the pool to back this policy's coverage.")

        pid = self.policies_count

        self.policy_owner[pid]     = gl.message.sender_address
        self.policy_premium[pid]   = premium_val
        self.policy_cover[pid]     = coverage_val
        self.policy_status[pid]    = "ACTIVE"
        self.policy_drama_url[pid] = ""
        self.policy_analysis[pid]  = "Policy active. No claims filed."
        self.policy_severity[pid]  = "NONE"

        self.total_reserved_coverage = new_reserved
        self.policies_count = int(pid) + 1
        return int(pid)

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC METHOD: FILE AN INSURANCE CLAIM (AI AUDIT)
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def file_claim(self, policy_id: int, drama_url: str) -> None:
        """
        Policy owners call this during a crisis by providing a link to the drama
        (expose post, recap blog). Triggers the non-deterministic AI PR Analyst audit.
        """
        if policy_id < 0 or policy_id >= int(self.policies_count):
            raise UserError("Policy does not exist.")

        status = self.policy_status.get(policy_id, "ACTIVE")
        if status != "ACTIVE":
            raise UserError("This insurance policy is no longer active.")

        owner = self.policy_owner.get(policy_id, Address("0x0000000000000000000000000000000000000000"))
        if gl.message.sender_address != owner:
            raise UserError("Only the policy owner can file a claim.")

        if len(drama_url.strip()) == 0:
            raise UserError("Drama URL evidence cannot be empty.")

        # ── Non-Deterministic Evaluation Block ────────────────────────
        def leader_fn() -> str:
            # 1. Fetch exposé report text
            try:
                page_text: str = gl.nondet.web.render(drama_url)
            except Exception as render_err:
                return json.dumps({
                    "error": f"URL_FETCH_FAILED: {str(render_err)}",
                    "claim_approved": False,
                    "offense_severity": "NONE",
                    "pr_analysis": f"Could not render the drama URL evidence: {str(render_err)}"
                })

            content = page_text.strip()
            if len(content) < 50:
                return json.dumps({
                    "error": "CONTENT_TOO_SHORT",
                    "claim_approved": False,
                    "offense_severity": "NONE",
                    "pr_analysis": "The drama URL returned empty or insufficient content."
                })

            # Truncate content to fit LLM window safely
            truncated_content = content[:5000]

            # 2. Instruct LLM to act as a PR Crisis Analyst
            prompt = f"""You are an objective AI PR Crisis Analyst and Online Ethics Specialist.
Your job is to read the cancel culture drama exposé text and evaluate whether the backlash against the creator is justified or representing an unfair witch-hunt/coordinated harassment.

Watchdog/Drama Text Content:
--- DRAMA TEXT START ---
{truncated_content}
--- DRAMA TEXT END ---

Please evaluate the allegations based on:
1. Moral / Legal Failures: Does the text document actual severe crimes, financial fraud, assault, or explicit hate speech? (If yes, this is a Justified Cancellation).
2. Witch-Hunt Factors: Is the backlash based on unverified rumors, coordinated bot manipulation, minor past mistakes from many years ago, or harmless jokes taken out of context? (If yes, this is an Unjustified Cancellation).

Determine the final verdict:
- "claim_approved": Set to true ONLY if the cancellation is unjustified/unfair (meaning they deserve the insurance payout). Set to false if the backlash is justified (e.g. crimes, abuse).
- "offense_severity": Set to "CRITICAL" if severe/actual harm is documented, or "TRIVIAL" if the allegations represent minor drama/witch-hunt.
- "pr_analysis": Provide a detailed 2-3 sentence PR analysis explaining how you distinguished valid criticism from coordinated cyberbullying in this specific text.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching the schema below. Do not wrap in markdown syntax like ```json, do not write explanations outside JSON.
{{
  "claim_approved": true | false,
  "offense_severity": "CRITICAL" | "TRIVIAL",
  "pr_analysis": "<Your detailed PR analyst review>"
}}"""

            # Run LLM
            raw_output = gl.nondet.exec_prompt(prompt)

            # Clean markdown code blocks if any
            cleaned = raw_output.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                inner_lines = []
                for line in lines[1:]:
                    if line.strip() == "```":
                        break
                    inner_lines.append(line)
                cleaned = "\n".join(inner_lines).strip()

            try:
                parsed = json.loads(cleaned)
                approved = bool(parsed.get("claim_approved", False))
                severity = str(parsed.get("offense_severity", "TRIVIAL")).strip().upper()
                if severity not in ["CRITICAL", "TRIVIAL"]:
                    severity = "TRIVIAL"
                analysis = str(parsed.get("pr_analysis", "No analysis provided.")).strip()

                return json.dumps({
                    "claim_approved": approved,
                    "offense_severity": severity,
                    "pr_analysis": analysis[:1000]
                })
            except Exception as parse_err:
                return json.dumps({
                    "error": f"JSON_PARSE_FAILED: {str(parse_err)}",
                    "claim_approved": False,
                    "offense_severity": "TRIVIAL",
                    "pr_analysis": "AI PR Analyst output was malformed. Claim evaluation failed."
                })

        def validator_fn(leader_result: str) -> bool:
            """
            Semantic PR Consensus. Compares the core boolean claim_approved
            to reach consensus, ignoring minor wording or severity differences.
            """
            try:
                leader_data = json.loads(leader_result)
            except Exception:
                return False

            if "error" in leader_data:
                allowed_errors = {"URL_FETCH_FAILED", "CONTENT_TOO_SHORT", "JSON_PARSE_FAILED"}
                return any(err in str(leader_data.get("error", "")) for err in allowed_errors)

            validator_raw = leader_fn()
            try:
                validator_data = json.loads(validator_raw)
            except Exception:
                return True  # Abstain (agree) if validator node faces a local error

            if "error" in validator_data:
                return True  # Abstain if validator gets network error

            leader_approved    = bool(leader_data.get("claim_approved", False))
            validator_approved = bool(validator_data.get("claim_approved", False))

            # Semantic agreement check on the core boolean claim_approved
            return leader_approved == validator_approved

        # Run Consensus Protocol
        consensus_json = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            res = json.loads(consensus_json)
        except Exception as e:
            raise UserError(f"Malformed consensus output: {str(e)}")

        if "error" in res:
            raise UserError(f"Claim audit failed: {res.get('error')}. {res.get('pr_analysis', '')}")

        approved = bool(res.get("claim_approved", False))
        severity = str(res.get("offense_severity", "TRIVIAL")).strip().upper()
        analysis = str(res.get("pr_analysis", "Claim evaluation finished."))

        # Reduce reserved coverage because this policy is no longer ACTIVE
        cover_payout = int(self.policy_cover.get(policy_id, 0))
        self.total_reserved_coverage = int(self.total_reserved_coverage) - cover_payout

        self.policy_drama_url[policy_id] = drama_url
        self.policy_analysis[policy_id]  = analysis
        self.policy_severity[policy_id]  = severity

        if approved:
            self.policy_status[policy_id] = "CLAIMED"
            
            # Reset cover amount first to prevent double-spending/re-entrancy
            self.policy_cover[policy_id] = 0

            # Transfer payout to claimant.
            # If the contract balance is less than the payout, transfer the maximum available balance.
            contract_balance = int(self.balance)
            payout_val = cover_payout if cover_payout <= contract_balance else contract_balance
            
            other = gl.get_contract_at(owner)
            other.emit_transfer(value=u256(payout_val))
        else:
            self.policy_status[policy_id] = "DENIED"

    # ═══════════════════════════════════════════════════════════════════
    # READ-ONLY VIEW METHODS
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.view
    def get_policy_count(self) -> int:
        """
        Returns the total number of policies purchased.
        """
        return int(self.policies_count)

    @gl.public.view
    def get_policy(self, policy_id: int) -> str:
        """
        Returns a JSON-serialized representation of a policy.
        """
        if policy_id < 0 or policy_id >= int(self.policies_count):
            raise UserError("Policy does not exist.")

        owner = self.policy_owner.get(policy_id, Address("0x0000000000000000000000000000000000000000"))

        return json.dumps({
            "id": policy_id,
            "owner": str(owner),
            "premium": int(self.policy_premium.get(policy_id, 0)),
            "cover": int(self.policy_cover.get(policy_id, 0)),
            "status": self.policy_status.get(policy_id, "ACTIVE"),
            "drama_url": self.policy_drama_url.get(policy_id, ""),
            "analysis": self.policy_analysis.get(policy_id, ""),
            "severity": self.policy_severity.get(policy_id, "NONE")
        })
