import Constants, { ExecutionEnvironment } from 'expo-constants';

import { monetizationConfig, purchasesConfig } from '@/config/monetization';

import { noopProvider } from './noop.provider';
import type { PurchasesProvider } from './provider';
import { createRevenueCatProvider } from './revenuecat.provider';

// Expo Go ne contient pas le module natif react-native-purchases.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** RevenueCat dans les builds natives configurées ; noop sinon (Expo Go, monétisation coupée, clé absente). */
export const activeProvider: PurchasesProvider =
  monetizationConfig.enabled && !isExpoGo && purchasesConfig.revenueCatIosKey
    ? createRevenueCatProvider(purchasesConfig.revenueCatIosKey)
    : noopProvider;
