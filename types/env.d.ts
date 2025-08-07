declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_SOCKET_URL: string;
      EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      EXPO_PUBLIC_OPENAI_API_KEY: string;
      EXPO_PUBLIC_NUTRITION_API_KEY: string;
    }
  }
}

export {};