# CancelShield — Cancel Culture Insurance Protocol

CancelShield is a decentralized insurance protocol protecting content creators and influencers from unfair "Cancel Culture" attacks and social media witch-hunts. Policyholders pay premium deposits locked in the insurance pool. When crisis backlash occurs, creators submit evidence. GenLayer's AI Validators parse the drama context, decide if the backlash represents a justified cancellation (severe crimes) or an unjustified witch-hunt (bot attack, minor jokes out of context), and payout coverage cover (5x premium) automatically if ruled unjustified.

---

### 💡 Why CancelShield DIES without GenLayer
Conventional blockchains cannot read Web2 social media exposé threads, recap blogs, or news links directly without trusted off-chain servers or custom centralized oracles. **GenLayer solves this natively** by executing non-deterministic web rendering (`web.render`) and LLM evaluation (`exec_prompt`) directly inside the smart contract, achieving decentralized validator consensus on qualitative crisis context, and releasing coverage payouts trustlessly.

---

## Core Insurance Workflow

1. **Buy Policy**: Creators buy coverage by locking native GEN premiums. Payout is set at 5x cover.
2. **File Claim**: When drama strikes, the creator submits a drama URL link as evidence.
3. **Smart Contract Audit**:
   - `web.render` extracts text from the drama URL page.
   - `exec_prompt` acts as a **PR Crisis Analyst**, reviewing context for crimes vs minor drama.
   - Outputs a structured JSON with: `claim_approved` (bool), `offense_severity` (CRITICAL | TRIVIAL), and `pr_analysis` (text).
4. **Custom Semantic Validator**:
   - Reaches consensus on the boolean `claim_approved` outcome.
   - If approved: Releases cover payout (5x premium) to the creator address.
   - If denied: Policy status transitions to `"DENIED"` and premium stays locked in the pool.

---

## Project Structure

```bash
CancelShield/
├── contracts/
│   └── cancelshield.py    # Core Intelligent Smart Contract (v0.2.16)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Three-column social app layout
│   │   ├── index.css      # Obsidian-CyberPink layout stylesheet
│   │   └── useCancelShield.js# Custom react hook wrapping the genlayer-js SDK
│   ├── .env               # Environment variable for contract address
│   ├── .npmrc             # Cloud build peer-dependency resolver config
│   ├── package.json       # React + Vite client dependencies
│   └── vite.config.js     # Dev server configuration
└── README.md              # Documentation
```

---

## Step-by-Step Deployment on GenLayer Studio

### 1. Prepare and Copy Contract Code
- Open **GenLayer Studio** (https://studio.genlayer.com).
- Create a new project or contract file named `cancelshield.py`.
- Copy and paste the contents of `contracts/cancelshield.py` into the studio editor.

### 2. Compile
- Verify the compiler version in the Studio matches `v0.2.16`.
- Click the **Compile** button in the studio and ensure there are no compilation errors.

### 3. Deploy
- Set the deployment parameters (none are required in the constructor).
- Click **Deploy** to deploy the contract.
- Copy the generated contract address (e.g. `0xCcD...`).

---

## Running the Frontend Locally

### 1. Configure the Environment
Navigate to the `frontend/` folder and edit the `.env` file to add your deployed contract address:
```bash
VITE_CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"
```

### 2. Install Dependencies
Open a terminal in the `frontend/` directory and run:
```bash
npm install
```

### 3. Run the Development Server
Launch the local Vite server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the dashboard.
