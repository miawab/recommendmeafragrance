import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			// User-specified palette: cream paper, caramel, warm brown, dark chocolate ink.
  			cream: {
  				'100': '#ffffff',
  				'200': '#fdf1e4',
  				'300': '#f3ddc3',
  				DEFAULT: '#fff8f0'
  			},
  			ink: {
  				'200': '#c9a591',
  				'400': '#8c5a3c',
  				'800': '#6b4540',
  				'900': '#5c3a35',
  				'950': '#4b2e2b'
  			},
  			amber: {
  				'50': '#faf0e6',
  				'100': '#f3ddc3',
  				'200': '#e6c19c',
  				'300': '#d3a06c',
  				'400': '#c08552',
  				'500': '#a86f42',
  				'600': '#8c5a3c',
  				'700': '#6b4530'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			// Feedback tones stay strictly inside the 4-color palette: dark
  			// chocolate = correct (strongest), caramel = partial, warm brown =
  			// miss/wrong (weakest). Distinguished by symbol + weight too, not
  			// color alone.
  			hit: '#4b2e2b',
  			partial: '#c08552',
  			miss: '#8c5a3c',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: 'var(--destructive)',
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)'
  		},
  		fontFamily: {
  			display: [
  				'var(--font-display-google)',
  				'sans-serif'
  			],
  			sans: [
  				'var(--font-sans-google)',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			card: '0 2px 10px rgba(75, 46, 43, 0.08), 0 1px 2px rgba(75, 46, 43, 0.10)',
  			'card-lg': '0 8px 30px rgba(75, 46, 43, 0.12), 0 2px 6px rgba(75, 46, 43, 0.10)'
  		},
  		keyframes: {
  			'pop-in': {
  				'0%': {
  					transform: 'scale(0.85)',
  					opacity: '0'
  				},
  				'60%': {
  					transform: 'scale(1.03)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'tile-flip': {
  				'0%': {
  					transform: 'rotateX(0deg)'
  				},
  				'50%': {
  					transform: 'rotateX(90deg)'
  				},
  				'100%': {
  					transform: 'rotateX(0deg)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			'burst-particle': {
  				'0%': { transform: 'scale(0) translate(0, 0)', opacity: '0' },
  				'15%': { opacity: '1' },
  				'100%': { transform: 'scale(1) translate(var(--tx), var(--ty))', opacity: '0' }
  			},
  			'bounce-in': {
  				'0%': { transform: 'scale(0.4) rotate(-8deg)', opacity: '0' },
  				'55%': { transform: 'scale(1.2) rotate(4deg)', opacity: '1' },
  				'75%': { transform: 'scale(0.92) rotate(-2deg)' },
  				'100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
  			},
  			wiggle: {
  				'0%, 100%': { transform: 'rotate(0deg)' },
  				'25%': { transform: 'rotate(-8deg)' },
  				'75%': { transform: 'rotate(8deg)' }
  			}
  		},
  		animation: {
  			'pop-in': 'pop-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both',
  			'tile-flip': 'tile-flip 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
  			shimmer: 'shimmer 1.6s linear infinite',
  			'burst-particle': 'burst-particle 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both',
  			'bounce-in': 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
  			wiggle: 'wiggle 0.4s ease-in-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
