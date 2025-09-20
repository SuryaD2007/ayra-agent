import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(-20px)' }
				},
				'scale-bounce': {
					'0%': { transform: 'scale(0.8)', opacity: '0' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-100px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'wave': {
					'0%, 100%': { transform: 'rotate(0deg)' },
					'25%': { transform: 'rotate(5deg)' },
					'75%': { transform: 'rotate(-5deg)' }
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0) scale(1)' },
					'50%': { transform: 'translateY(-20px) scale(1.02)' }
				},
				'spin-reverse': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(-360deg)' }
				},
				'morph': {
					'0%, 100%': { borderRadius: '40% 60% 70% 30% / 40% 40% 60% 50%' },
					'34%': { borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%' },
					'67%': { borderRadius: '100% 60% 60% 100% / 100% 100% 60% 60%' }
				},
				'glow-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)' 
					},
					'50%': { 
						boxShadow: '0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.2)' 
					}
				},
				'particle-float': {
					'0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.7' },
					'25%': { transform: 'translateY(-20px) rotate(90deg)', opacity: '1' },
					'50%': { transform: 'translateY(-10px) rotate(180deg)', opacity: '0.8' },
					'75%': { transform: 'translateY(-30px) rotate(270deg)', opacity: '0.9' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s cubic-bezier(0.23, 1, 0.320, 1)',
				'fade-out': 'fade-out 0.4s ease-in',
				'scale-bounce': 'scale-bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'slide-in-left': 'slide-in-left 0.7s cubic-bezier(0.23, 1, 0.320, 1)',
				'slide-in-right': 'slide-in-right 0.7s cubic-bezier(0.23, 1, 0.320, 1)',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-down': 'slide-down 0.3s ease-out',
				'wave': 'wave 2s ease-in-out infinite',
				'float-slow': 'float-slow 6s ease-in-out infinite',
				'spin-reverse': 'spin-reverse 20s linear infinite',
				'morph': 'morph 8s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
				'particle-float': 'particle-float 4s ease-in-out infinite'
			},
			transitionTimingFunction: {
				'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
				'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;