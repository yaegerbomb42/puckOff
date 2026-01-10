import React, { useState } from 'react';
import { TIERS, getAllIcons } from '../../utils/economy';

// Get all 150 icons from the centralized database
const ICON_SLOTS = getAllIcons().sort((a, b) => a.id - b.id);

export default function IconChooser({ ownedIcons = [], onClose, onSelect, equippedIcon }) {
    const [hoveredIcon, setHoveredIcon] = useState(null);
    const [selectedPreview, setSelectedPreview] = useState(null);

    const groupedByTier = {};
    ICON_SLOTS.forEach(icon => {
        if (!groupedByTier[icon.tier]) groupedByTier[icon.tier] = [];
        groupedByTier[icon.tier].push(icon);
    });

    const ownedSet = new Set(ownedIcons);
    const totalOwned = ownedIcons.length;

    const previewIcon = hoveredIcon || selectedPreview || (equippedIcon ? ICON_SLOTS.find(i => i.id === equippedIcon) : null);

    return (
        <div className="icon-chooser-overlay" onClick={onClose}>
            <div className="icon-chooser-modal" onClick={e => e.stopPropagation()}>
                {/* Preview Panel */}
                <div className="preview-panel">
                    <div className="preview-puck">
                        {previewIcon ? (
                            <>
                                <img
                                    src={previewIcon.imageUrl}
                                    alt={previewIcon.name}
                                    className="preview-image"
                                />
                                <div className="preview-info">
                                    <div className="preview-name">{previewIcon.name}</div>
                                    <div
                                        className="preview-tier"
                                        style={{ color: TIERS[previewIcon.tier]?.color }}
                                    >
                                        {TIERS[previewIcon.tier]?.name || 'Unknown'}
                                    </div>
                                </div>
                                {ownedSet.has(previewIcon.id) && (
                                    <button
                                        className="equip-btn"
                                        onClick={() => onSelect && onSelect(previewIcon)}
                                    >
                                        {equippedIcon === previewIcon.id ? '✓ EQUIPPED' : 'EQUIP'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="no-preview">
                                <span>👆</span>
                                <p>Hover over an icon to preview</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collection Grid */}
                <div className="collection-panel">
                    <div className="modal-header">
                        <h2>✨ ICON COLLECTION</h2>
                        <p className="collection-progress">{totalOwned} / 150 Collected</p>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>

                    <div className="icon-grid-container">
                        {Object.entries(groupedByTier).map(([tier, icons]) => {
                            const tierData = TIERS[tier];
                            const ownedInTier = icons.filter(i => ownedSet.has(i.id)).length;

                            return (
                                <div key={tier} className="tier-section">
                                    <div className="tier-header" style={{ borderColor: tierData.color }}>
                                        <span className="tier-badge" style={{ background: tierData.color }}>
                                            {tierData.isMystery ? '???' : tierData.name}
                                        </span>
                                        <span className="tier-count">{ownedInTier} / {icons.length}</span>
                                    </div>
                                    <div className="tier-icons">
                                        {icons.map(icon => {
                                            const owned = ownedSet.has(icon.id);
                                            const isEquipped = equippedIcon === icon.id;
                                            return (
                                                <div
                                                    key={icon.id}
                                                    className={`icon-slot ${owned ? 'owned' : 'locked'} ${isEquipped ? 'equipped' : ''}`}
                                                    style={{
                                                        borderColor: owned ? tierData.color : '#333',
                                                        boxShadow: owned ? `0 0 10px ${tierData.color}40` : 'none'
                                                    }}
                                                    onMouseEnter={() => owned && setHoveredIcon(icon)}
                                                    onMouseLeave={() => setHoveredIcon(null)}
                                                    onClick={() => {
                                                        if (owned) {
                                                            setSelectedPreview(icon);
                                                        }
                                                    }}
                                                >
                                                    {owned ? (
                                                        <>
                                                            <div className="icon-visual">
                                                                <img src={icon.imageUrl} alt={icon.name} className="icon-img" />
                                                            </div>
                                                            {isEquipped && <div className="equipped-badge">✓</div>}
                                                        </>
                                                    ) : (
                                                        <div className="icon-visual locked-visual">?</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .icon-chooser-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.9);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000;
                    font-family: 'Orbitron', sans-serif;
                }
                .icon-chooser-modal {
                    background: linear-gradient(135deg, #0a0a1a, #1a0a2e);
                    border: 1px solid #333; border-radius: 20px;
                    width: 95%; max-width: 900px; max-height: 85vh;
                    overflow: hidden; display: flex; flex-direction: column;
                }
                .modal-header {
                    padding: 1.5rem; text-align: center;
                    border-bottom: 1px solid #333; position: relative;
                }
                .modal-header h2 {
                    margin: 0; color: #fff;
                    background: linear-gradient(45deg, #ffd700, #ff006e);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .collection-progress { color: #888; margin-top: 0.5rem; }
                .close-btn {
                    position: absolute; right: 1rem; top: 1rem;
                    background: none; border: none; color: #888;
                    font-size: 1.5rem; cursor: pointer;
                }
                .close-btn:hover { color: #ff006e; }

                .icon-grid-container {
                    flex: 1; overflow-y: auto; padding: 1.5rem;
                }

                .tier-section { margin-bottom: 2rem; }
                .tier-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding-bottom: 0.5rem; margin-bottom: 1rem;
                    border-bottom: 2px solid;
                }
                .tier-badge {
                    padding: 0.3rem 1rem; border-radius: 20px;
                    font-size: 0.8rem; font-weight: bold; color: #000;
                }
                .tier-count { color: #666; font-size: 0.85rem; }

                .tier-icons {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 0.8rem;
                }

                .icon-slot {
                    aspect-ratio: 1; border-radius: 50%;
                    border: 3px solid; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    transition: all 0.3s; cursor: pointer;
                    background: rgba(0,0,0,0.3);
                }
                .icon-slot.owned:hover {
                    transform: scale(1.1);
                }
                .icon-slot.locked {
                    opacity: 0.4; cursor: not-allowed;
                }

                .icon-visual { 
                    font-size: 1.8rem; 
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                }
                .icon-img {
                    width: 90%; height: 90%;
                    object-fit: contain;
                    border-radius: 50%;
                }
                .locked-visual { color: #333; font-size: 1.5rem; }

                /* Two-Panel Layout */
                .icon-chooser-modal {
                    display: flex; flex-direction: row;
                    max-width: 1200px; width: 95%;
                }
                .preview-panel {
                    width: 280px; min-width: 280px;
                    background: linear-gradient(180deg, #0a0a1a, #1a0a2e);
                    border-right: 1px solid #333;
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem;
                }
                .collection-panel {
                    flex: 1; display: flex; flex-direction: column;
                    overflow: hidden;
                }
                .preview-puck {
                    display: flex; flex-direction: column;
                    align-items: center; text-align: center;
                }
                .preview-image {
                    width: 180px; height: 180px;
                    border-radius: 50%;
                    border: 4px solid #00d4ff;
                    box-shadow: 0 0 40px rgba(0,212,255,0.4);
                    object-fit: cover;
                    margin-bottom: 1.5rem;
                    animation: previewPulse 2s ease-in-out infinite;
                }
                .preview-info { margin-bottom: 1rem; }
                .preview-name { font-size: 1.2rem; font-weight: bold; color: #fff; }
                .preview-tier { font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem; }
                .equip-btn {
                    padding: 0.8rem 2rem;
                    background: linear-gradient(45deg, #00ff87, #00d4ff);
                    border: none; border-radius: 30px;
                    color: #000; font-weight: bold; font-size: 1rem;
                    cursor: pointer; font-family: 'Orbitron', sans-serif;
                    transition: all 0.3s;
                }
                .equip-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(0,255,135,0.5);
                }
                .no-preview {
                    color: #555; text-align: center;
                }
                .no-preview span { font-size: 3rem; display: block; margin-bottom: 1rem; }
                .no-preview p { font-size: 0.9rem; }

                .equipped-badge {
                    position: absolute; top: -4px; right: -4px;
                    background: #00ff87; color: #000;
                    width: 20px; height: 20px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.7rem; font-weight: bold;
                }
                .icon-slot { position: relative; }
                .icon-slot.equipped { border-color: #00ff87 !important; box-shadow: 0 0 15px rgba(0,255,135,0.6) !important; }

                @keyframes previewPulse {
                    0%, 100% { box-shadow: 0 0 40px rgba(0,212,255,0.4); }
                    50% { box-shadow: 0 0 60px rgba(0,212,255,0.7); }
                }

                /* Scrollbar */
                .icon-grid-container::-webkit-scrollbar { width: 8px; }
                .icon-grid-container::-webkit-scrollbar-track { background: #111; }
                .icon-grid-container::-webkit-scrollbar-thumb { 
                    background: #333; border-radius: 4px; 
                }
            `}</style>
        </div>
    );
}
