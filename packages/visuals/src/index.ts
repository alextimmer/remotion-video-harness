// Public surface of @harness/visuals. Consumed by client projects via a
// `file:` dependency; see packages/visuals/README.md and INDEX.md.

// Theme contract: consumers fulfil VisualsTheme once and wrap each reel in the provider.
export {
	VisualsThemeProvider,
	useVisualsTheme,
	mergeTheme,
	DEFAULT_VISUALS_THEME,
} from './theme';
export type {
	VisualsTheme,
	PartialVisualsTheme,
	VisualsColors,
	VisualsFonts,
	VisualsSprings,
} from './theme';

// text-effects
export {Typewriter} from './text-effects/Typewriter';
export {StaggeredWords} from './text-effects/StaggeredWords';
export {HighlightWord} from './text-effects/HighlightWord';

// backgrounds
export {HexScrollBackground} from './backgrounds/HexScrollBackground';
export {HexGrid} from './backgrounds/HexGrid';
export {FloatingParticles} from './backgrounds/FloatingParticles';

// icons
export {ShieldIcon} from './icons/ShieldIcon';
export {CheckmarkIcon} from './icons/CheckmarkIcon';
export {DropIcon} from './icons/DropIcon';
export {ThermometerIcon} from './icons/ThermometerIcon';
export {MinimalIcon} from './icons/MinimalIcon';
export type {MinimalIconVariant} from './icons/MinimalIcon';

// animations
export {PriceBalanceBadge} from './price-balance-badge/PriceBalanceBadge';
export {CounterfeitLabelJar} from './counterfeit-label-jar/CounterfeitLabelJar';
export {GermanyDeliveryMap} from './germany-delivery-map/GermanyDeliveryMap';
export {DESTINATION_SVG, GERMANY_VIEWBOX} from './germany-delivery-map/data/germany-map-data';
export {GlobeFlightPath} from './globe-flight-path/GlobeFlightPath';
export type {GlobePoint} from './globe-flight-path/GlobeFlightPath';
export {LabCertificateReveal} from './lab-certificate-reveal/LabCertificateReveal';
export {FallingCoinsCounter} from './falling-coins-counter/FallingCoinsCounter';

// audio
export {Captions} from './captions/Captions';
export type {CaptionPage, CaptionWord} from './captions/Captions';
export {MusicBed} from './audio/MusicBed';
export type {DuckWindow} from './audio/MusicBed';
export {Voice, VoiceProvider, useVoice} from './audio/Voice';
export {deriveVoiceTiming} from './audio/timing';
export type {VoiceTiming} from './audio/timing';
export {voiceFrames, voiceStartFrame} from './audio/voice-types';
export type {VoiceIndex, VoiceScene, VoicePage, VoiceWord} from './audio/voice-types';
