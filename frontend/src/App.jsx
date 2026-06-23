import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Coins, 
  Send, 
  RefreshCw, 
  User, 
  ExternalLink, 
  Activity, 
  Skull, 
  VolumeX, 
  Award, 
  HelpCircle, 
  Sliders,
  Globe,
  Radio
} from 'lucide-react';
import { useCancelShield, formatGen } from './useCancelShield';

export default function App() {
  const {
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
    contractAddress
  } = useCancelShield();

  // Selected policy in Column 2 to inspect in Column 3
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  // Buy Policy premium slider value
  const [premiumSlider, setPremiumSlider] = useState('2');
  const [buyErr, setBuyErr] = useState('');

  // Drama URL claim form state
  const [dramaUrl, setDramaUrl] = useState('');
  const [claimErr, setClaimErr] = useState('');

  const truncateAddr = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'N/A';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const handleBuyPolicy = async (e) => {
    e.preventDefault();
    setBuyErr('');
    try {
      await buyPolicy(premiumSlider);
      setBuyErr('');
    } catch (err) {
      setBuyErr(err.message || 'Transaction failed');
    }
  };

  const handleFileClaim = async (e, policyId) => {
    e.preventDefault();
    setClaimErr('');

    if (dramaUrl.trim() === '') {
      setClaimErr('Drama URL evidence is required.');
      return;
    }

    try {
      await fileClaim(policyId, dramaUrl);
      setDramaUrl('');
    } catch (err) {
      setClaimErr(err.message || 'Claim submission failed');
    }
  };

  // Find selected policy object
  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  // Auto-select the first policy when they load
  useEffect(() => {
    if (policies.length > 0 && selectedPolicyId === null) {
      setSelectedPolicyId(policies[0].id);
    }
  }, [policies, selectedPolicyId]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="cyber-card" style={{ padding: '12px 20px', borderRadius: '8px' }}>
        <div className="brand-section">
          <span className="brand-logo" style={{ fontSize: '1.8rem' }}>🎭</span>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.4rem' }}>CancelShield</h1>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Decentralized Cancel Culture Insurance Protocol</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {address ? (
            <>
              <div className="wallet-badge" style={{ borderColor: 'var(--accent-pink)', background: 'rgba(255, 0, 127, 0.05)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-pink)', boxShadow: '0 0 8px var(--accent-pink)' }}></span>
                <span style={{ fontSize: '0.85rem' }}>Studio Active</span>
              </div>
              <div className="wallet-badge connected">
                <User size={14} style={{ color: 'var(--accent-green)' }} />
                <span style={{ fontSize: '0.85rem' }}>{truncateAddr(address)}</span>
              </div>
            </>
          ) : (
            <button className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)' }} onClick={connectWallet} disabled={loading}>
              <Award size={14} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* THREE-COLUMN SOCIAL LAYOUT */}
      <div className="app-layout">
        
        {/* COLUMN 1: CONTROL SIDEBAR */}
        <div className="sidebar-stats">
          
          {/* PITCH BANNER */}
          <div className="pitch-banner">
            <h3 className="pitch-title">Why CancelShield DIES without GenLayer</h3>
            <p className="pitch-text" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              Traditional blockchains cannot fetch social media drama threads or distinguish coordinated bot harassment from severe legal offenses. Centralized APIs introduce single points of failure.
              <strong> GenLayer enables CancelShield to run natively:</strong> rendering drama links (`web.render`), analyzing cancel justification (`exec_prompt`), reaching consensus, and payouts 5x cover automatically.
            </p>
          </div>

          {/* BUY POLICY CARD */}
          <div className="cyber-card">
            <h2 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} style={{ color: 'var(--accent-pink)' }} />
              <span>Activate Shield Cover</span>
            </h2>
            <form onSubmit={handleBuyPolicy}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Policy Premium:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{premiumSlider} GEN</span>
                </div>
                <div className="premium-slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    className="premium-slider"
                    value={premiumSlider}
                    onChange={(e) => setPremiumSlider(e.target.value)}
                    disabled={loading || !address}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Min: 1 GEN</span>
                  <span>Max: 10 GEN</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '10px', marginBottom: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Guaranteed Cover Coverage (5x):</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{premiumSlider * 5} GEN</span>
              </div>

              {buyErr && (
                <p style={{ color: 'var(--accent-red)', fontSize: '12px', marginBottom: '8px' }}>
                  {buyErr}
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading || !address}>
                <Coins size={14} />
                <span>Buy Protection Policy</span>
              </button>
            </form>
          </div>

          {/* POOL BALANCE CARD */}
          <div className="cyber-card" style={{ background: 'linear-gradient(135deg, rgba(17,19,30,0.8) 0%, rgba(9,10,14,0.9) 100%)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span>Insurance Pool Stats</span>
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pool Reserves:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>{formatGen(contractBalance)} GEN</span>
            </div>
          </div>

        </div>

        {/* COLUMN 2: LIVE DRAMA FEED */}
        <div className="feed-column">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={16} className="animate-pulse" style={{ color: 'var(--accent-pink)' }} />
              <span>Trending Crisis Feed</span>
            </h2>
            <button className="btn btn-secondary" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }} onClick={fetchPoliciesState} disabled={loading}>
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
          </div>

          {policies.length === 0 ? (
            <div className="cyber-card" style={{ textAlign: 'center', padding: '40px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <VolumeX size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
              <p style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Quiet on social channels</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Buy protection policies to populate the live crisis feed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {policies.map((policy) => (
                <div 
                  key={policy.id} 
                  className={`feed-item-card ${selectedPolicyId === policy.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPolicyId(policy.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>CASE #{policy.id}</span>
                    <span className={`status-badge ${policy.status.toLowerCase()}`}>{policy.status}</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Creator: {truncateAddr(policy.owner)}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {policy.drama_url ? policy.drama_url : 'No crisis drama filed.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Premium: {formatGen(policy.premium)} GEN</span>
                    <span className="cover-badge" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>{formatGen(policy.cover)} GEN Cover</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 3: PR CRISIS COMMAND CENTER */}
        <div className="command-column">
          {selectedPolicy ? (
            <div className="cyber-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>PR Threat Assessment Log</span>
                    <h2 style={{ fontSize: '1.4rem', marginTop: '2px' }}>Case #{selectedPolicy.id} Command Center</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Policyholder: <code>{selectedPolicy.owner}</code></span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="cover-badge" style={{ fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
                      {formatGen(selectedPolicy.cover)} GEN Cover
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Premium Paid: {formatGen(selectedPolicy.premium)} GEN</span>
                  </div>
                </div>

                {/* Case Status Check */}
                {selectedPolicy.status === 'ACTIVE' ? (
                  /* Form to File Claim */
                  <div>
                    <div style={{ background: 'rgba(255, 0, 127, 0.03)', border: '1px solid rgba(255, 0, 127, 0.15)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '0.95rem', color: '#fda4af', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Radio size={14} className="animate-pulse" />
                        <span>File Crisis Coverage Claim</span>
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '14px' }}>
                        If you are currently experiencing active online backlash or cancel campaigns, submit evidence (Twitter exposé thread, Recapped blog link, exposé video/news URL) to trigger AI PR Analyst audit evaluation.
                      </p>

                      <form onSubmit={(e) => handleFileClaim(e, selectedPolicy.id)}>
                        <div className="form-group">
                          <label>Watchdog Drama URL Evidence</label>
                          <input
                            type="url"
                            placeholder="https://twitter.com/expose-thread or https://youtube.com/expose"
                            value={dramaUrl}
                            onChange={(e) => setDramaUrl(e.target.value)}
                            disabled={loading || !address}
                          />
                        </div>

                        {claimErr && (
                          <p style={{ color: 'var(--accent-red)', fontSize: '12px', marginBottom: '10px' }}>
                            {claimErr}
                          </p>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading || !address || address.toLowerCase() !== selectedPolicy.owner.toLowerCase()}>
                          <Send size={14} />
                          <span>Trigger Crisis Review</span>
                        </button>
                        
                        {address && address.toLowerCase() !== selectedPolicy.owner.toLowerCase() && (
                          <p style={{ fontSize: '11px', color: 'var(--accent-red)', marginTop: '6px', textAlign: 'center' }}>
                            * Only the creator who owns this policy can file a claim.
                          </p>
                        )}
                      </form>
                    </div>

                    {/* Testing Guide in Command Center */}
                    <div className="cyber-card" style={{ background: 'rgba(0,0,0,0.2)', borderStyle: 'dashed' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} />
                        <span>Audit Testing Guidelines</span>
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        - **Approved Claim Case**: Test with a URL describing minor old jokes from 10 years ago or bot attacks. The AI PR Analyst should rule it as <strong>TRIVIAL</strong> and approve the claim (`claim_approved = true`).
                        <br />
                        - **Denied Claim Case**: Test with a URL verifying actual documented crimes or severe fraud. The AI Auditor will rate it as <strong>CRITICAL</strong> and deny the claim (`claim_approved = false`).
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Completed Audit details */
                  <div>
                    {/* Verdict Banner */}
                    <div style={{ 
                      padding: '20px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '20px',
                      background: selectedPolicy.status === 'CLAIMED' ? 'rgba(57, 255, 20, 0.04)' : 'rgba(255, 51, 51, 0.04)',
                      border: selectedPolicy.status === 'CLAIMED' ? '1px solid rgba(57, 255, 20, 0.2)' : '1px solid rgba(255, 51, 51, 0.2)'
                    }}>
                      {selectedPolicy.status === 'CLAIMED' ? (
                        <>
                          <ShieldCheck size={28} style={{ color: 'var(--accent-green)' }} />
                          <div>
                            <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-green)' }}>Drama Verdict: CLAIM APPROVED</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI ruled backlash as an unjustified cancel campaign. Coverage released.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Skull size={28} style={{ color: 'var(--accent-red)' }} />
                          <div>
                            <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-red)' }}>Drama Verdict: CLAIM DENIED</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI ruled backlash as justified criticism for severe failures. Premium slashed.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Threat level indicator */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Offense Severity Level:</span>
                      <span className={`threat-badge ${selectedPolicy.severity.toLowerCase()}`}>
                        {selectedPolicy.severity === 'CRITICAL' ? <Skull size={12} /> : <ShieldCheck size={12} />}
                        <span>{selectedPolicy.severity} THREAT LEVEL</span>
                      </span>
                    </div>

                    {/* AI PR Analysis text */}
                    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '16px', borderLeft: `3px solid ${selectedPolicy.status === 'CLAIMED' ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        AI PR Crisis Analyst Reasoning
                      </span>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                        "{selectedPolicy.analysis}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Watchdog Link Footer */}
              {selectedPolicy.drama_url && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '20px', fontSize: '0.8rem' }}>
                  <strong>Watchdog/Exposé Link Evidence:</strong>
                  <a href={selectedPolicy.drama_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', wordBreak: 'break-all' }}>
                    <span>View Drama Source</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Selected State Default Placeholder */
            <div className="cyber-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Globe size={40} style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-secondary)' }}>No Active Case Selected</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '4px', maxWidth: '300px' }}>Select an active or evaluated policy case from the Trending Crisis Feed to trigger or inspect PR threat assessments.</p>
            </div>
          )}
        </div>

      </div>

      {/* TRANSACTION FLOAT LOADER */}
      {txHash && (
        <div className="glass-panel status-log-card" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-pink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', color: 'var(--accent-pink)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span style={{ fontSize: '0.85rem' }}>GenLayer PR Analyst Log</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>{txStatus}</p>
          <a 
            href={`https://studio.genlayer.com/tx/${txHash}`} 
            target="_blank" 
            rel="noreferrer" 
            style={{ fontSize: '11px', color: 'var(--accent-cyan)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            Studio Hash: {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
